import { strict_output } from "@/lib/gpt";
import { getAuthSession } from "@/lib/nextauth";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getFallbackQuestions } from "@/lib/fallback-questions";

export const runtime = "nodejs";
export const maxDuration = 500;

export async function POST(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "You must be logged in to create a game." },
    //     {
    //       status: 401,
    //     }
    //   );
    // }
    const body = await req.json();
    const { amount, topic, type } = getQuestionsSchema.parse(body);
    
    try {
      // First try to get questions from OpenAI
      let questions: any;
      if (type === "open_ended") {
        questions = await strict_output(
          "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 words, store all the pairs of answers and questions in a JSON array",
          new Array(amount).fill(
            `You are to generate a random hard open-ended questions about ${topic}`
          ),
          {
            question: "question",
            answer: "answer with max length of 15 words",
          }
        );
      } else if (type === "mcq") {
        questions = await strict_output(
          "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words, store all answers and questions and options in a JSON array",
          new Array(amount).fill(
            `You are to generate a random hard mcq question about ${topic}`
          ),
          {
            question: "question",
            answer: "answer with max length of 15 words",
            option1: "option1 with max length of 15 words",
            option2: "option2 with max length of 15 words",
            option3: "option3 with max length of 15 words",
          }
        );
      }
      
      // If OpenAI successfully generated questions, return them
      if (questions && questions.length > 0) {
        return NextResponse.json(
          {
            questions: questions,
            source: "openai"
          },
          {
            status: 200,
          }
        );
      }
      
      // If we get here, OpenAI failed to generate questions (empty array returned)
      throw new Error("OpenAI returned empty questions array");
      
    } catch (openaiError) {
      // OpenAI API failed, use fallback questions instead
      console.log("Using fallback questions due to OpenAI error:", openaiError.message);
      
      const fallbackQuestions = getFallbackQuestions(topic, type, amount);
      
      return NextResponse.json(
        {
          questions: fallbackQuestions,
          source: "fallback"
        },
        {
          status: 200,
        }
      );
    }
    
  } catch (error) {
    console.error("Error in questions route:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      return NextResponse.json(
        { 
          error: "An unexpected error occurred.",
          details: error instanceof Error ? error.message : "Unknown error" 
        },
        {
          status: 500,
        }
      );
    }
  }
}
