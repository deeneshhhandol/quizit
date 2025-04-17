// Fallback questions to use when OpenAI API fails or rate limits are hit
// These are categorized by topic for both MCQ and open-ended questions

type MCQQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

type OpenEndedQuestion = {
  question: string;
  answer: string;
};

// General knowledge questions that can be used for any topic
const generalKnowledgeMCQ: MCQQuestion[] = [
  {
    question: "What is the capital of France?",
    answer: "Paris",
    option1: "London",
    option2: "Berlin",
    option3: "Rome",
  },
  {
    question: "Which planet is known as the Red Planet?",
    answer: "Mars",
    option1: "Venus",
    option2: "Jupiter",
    option3: "Mercury",
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    answer: "William Shakespeare",
    option1: "Charles Dickens",
    option2: "Jane Austen",
    option3: "Mark Twain",
  },
  {
    question: "What is the chemical symbol for gold?",
    answer: "Au",
    option1: "Ag",
    option2: "Fe",
    option3: "Cu",
  },
  {
    question: "What is the largest ocean on Earth?",
    answer: "Pacific Ocean",
    option1: "Atlantic Ocean",
    option2: "Indian Ocean",
    option3: "Arctic Ocean",
  }
];

const programmingMCQ: MCQQuestion[] = [
  {
    question: "Which language is primarily used for web development?",
    answer: "JavaScript",
    option1: "C++",
    option2: "Swift",
    option3: "Rust",
  },
  {
    question: "What does HTML stand for?",
    answer: "HyperText Markup Language",
    option1: "High Tech Modern Language",
    option2: "Hyper Transfer Modeling Language",
    option3: "Home Tool Management Language",
  },
  {
    question: "Which of these is a JavaScript framework?",
    answer: "React",
    option1: "Django",
    option2: "Flask",
    option3: "Laravel",
  }
];

const scienceMCQ: MCQQuestion[] = [
  {
    question: "What is the chemical formula for water?",
    answer: "H2O",
    option1: "CO2",
    option2: "NaCl",
    option3: "O2",
  },
  {
    question: "Which element has the atomic number 1?",
    answer: "Hydrogen",
    option1: "Oxygen",
    option2: "Carbon",
    option3: "Helium",
  }
];

// Open-ended questions
const generalKnowledgeOpenEnded: OpenEndedQuestion[] = [
  {
    question: "Name the longest river in the world.",
    answer: "Nile River",
  },
  {
    question: "Who painted the Mona Lisa?",
    answer: "Leonardo da Vinci",
  },
  {
    question: "What year did World War II end?",
    answer: "1945",
  },
  {
    question: "What is the largest mammal on Earth?",
    answer: "Blue Whale",
  },
  {
    question: "What is the capital of Japan?",
    answer: "Tokyo",
  }
];

const programmingOpenEnded: OpenEndedQuestion[] = [
  {
    question: "What programming language was created by Guido van Rossum?",
    answer: "Python",
  },
  {
    question: "What does CSS stand for?",
    answer: "Cascading Style Sheets",
  },
  {
    question: "What is the main purpose of a database?",
    answer: "To store, retrieve, and manage data",
  }
];

const scienceOpenEnded: OpenEndedQuestion[] = [
  {
    question: "What is photosynthesis?",
    answer: "Process by which plants convert light energy into chemical energy",
  },
  {
    question: "What is Newton's First Law of Motion?",
    answer: "An object at rest stays at rest, and an object in motion stays in motion",
  }
];

// Function to get fallback questions based on topic and type
export function getFallbackQuestions(topic: string, type: 'mcq' | 'open_ended', amount: number = 5): any[] {
  // Convert topic to lowercase for easier matching
  const topicLower = topic.toLowerCase();
  let questions;

  if (type === 'mcq') {
    // Select MCQ questions based on topic
    if (topicLower.includes('programming') || topicLower.includes('coding') || topicLower.includes('javascript') || topicLower.includes('python')) {
      questions = programmingMCQ;
    } else if (topicLower.includes('science') || topicLower.includes('chemistry') || topicLower.includes('physics') || topicLower.includes('biology')) {
      questions = scienceMCQ;
    } else {
      // Default to general knowledge
      questions = generalKnowledgeMCQ;
    }
  } else {
    // Select open-ended questions based on topic
    if (topicLower.includes('programming') || topicLower.includes('coding') || topicLower.includes('javascript') || topicLower.includes('python')) {
      questions = programmingOpenEnded;
    } else if (topicLower.includes('science') || topicLower.includes('chemistry') || topicLower.includes('physics') || topicLower.includes('biology')) {
      questions = scienceOpenEnded;
    } else {
      // Default to general knowledge
      questions = generalKnowledgeOpenEnded;
    }
  }

  // If we don't have enough questions, duplicate some to reach the requested amount
  if (questions.length < amount) {
    const repeats = Math.ceil(amount / questions.length);
    questions = Array(repeats).fill(questions).flat().slice(0, amount);
  } else {
    // Otherwise, take a random selection of the requested amount
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, amount);
  }

  return questions;
}