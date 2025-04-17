import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Exponential backoff settings
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second in milliseconds

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

/**
 * Helper function to implement exponential backoff retry logic for API calls
 * @param fn The async function to retry
 * @param retries Number of retries remaining
 * @param delay Delay between retries in milliseconds
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if we've reached the max retries or if this isn't a retryable error
    if (retries <= 0 || !isRetryableError(error)) {
      throw error;
    }

    console.log(`API call failed, retrying in ${delay}ms... (${retries} retries left)`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff (2x delay each time)
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Determines if an error should trigger a retry
 */
function isRetryableError(error: any): boolean {
  // Retry on rate limit errors (429) or certain server errors (5xx)
  if (axios.isAxiosError(error)) {
    if (!error.response || error.response.status === undefined) {
      return false;
    }
    return error.response.status === 429 || 
           (error.response.status >= 500 && error.response.status < 600);
  }
  return error?.status === 429 || 
         (error?.status >= 500 && error?.status < 600);
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
): Promise<
  {
    question: string;
    answer: string;
  }[]
> {
  // if the user input is in a list, we also process the output as a list of json
  const list_input: boolean = Array.isArray(user_prompt);
  // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  // start off with no error message
  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    // if output_format contains dynamic elements, process it accordingly
    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    // if input is in a list format, ask it to generate json in a list
    if (list_input) {
      output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
    }

    try {
      // Use OpenAI to get a response with retry logic for rate limits
      const response = await withRetry(async () => {
        const apiCall = await openai.chat.completions.create({
          temperature: temperature,
          model: model,
          messages: [
            {
              role: "system",
              content: system_prompt + output_format_prompt + error_msg,
            },
            { role: "user", content: user_prompt.toString() },
          ],
        });
        return apiCall;
      });

      let res: string =
        response.choices[0].message?.content?.replace(/'/g, '"') ?? "";

      // ensure that we don't replace away apostrophes in text
      res = res.replace(/(\w)"(\w)/g, "$1'$2");

      if (verbose) {
        console.log(
          "System prompt:",
          system_prompt + output_format_prompt + error_msg
        );
        console.log("\nUser prompt:", user_prompt);
        console.log("\nGPT response:", res);
      }

      // try-catch block to ensure output format is adhered to
      try {
        let output: any = JSON.parse(res);

        if (list_input) {
          if (!Array.isArray(output)) {
            throw new Error("Output format not in a list of json");
          }
        } else {
          output = [output];
        }

        // check for each element in the output_list, the format is correctly adhered to
        for (let index = 0; index < output.length; index++) {
          for (const key in output_format) {
            // unable to ensure accuracy of dynamic output header, so skip it
            if (/<.*?>/.test(key)) {
              continue;
            }

            // if output field missing, raise an error
            if (!(key in output[index])) {
              throw new Error(`${key} not in json output`);
            }

            // check that one of the choices given for the list of words is an unknown
            if (Array.isArray(output_format[key])) {
              const choices = output_format[key] as string[];
              // ensure output is not a list
              if (Array.isArray(output[index][key])) {
                output[index][key] = output[index][key][0];
              }
              // output the default category (if any) if GPT is unable to identify the category
              if (!choices.includes(output[index][key]) && default_category) {
                output[index][key] = default_category;
              }
              // if the output is a description format, get only the label
              if (output[index][key].includes(":")) {
                output[index][key] = output[index][key].split(":")[0];
              }
            }
          }

          // if we just want the values for the outputs
          if (output_value_only) {
            output[index] = Object.values(output[index]);
            // just output without the list if there is only one element
            if (output[index].length === 1) {
              output[index] = output[index][0];
            }
          }
        }

        return list_input ? output : output[0];
      } catch (e) {
        error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
        console.log("An exception occurred:", e);
        console.log("Current invalid json format:", res);
      }
    } catch (error) {
      // If we've exhausted retries and still getting errors
      if (i === num_tries - 1) {
        console.error("OpenAI API error after multiple retries:", error);
        return [];
      }
      // Wait before trying again with increasing delay
      const delay = 1000 * (i + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return [];
}
