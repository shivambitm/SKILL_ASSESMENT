// Free AI alternatives for question generation
import axios from 'axios';

export interface GeneratedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Using Hugging Face Inference API (Free)
export const generateQuestionsHuggingFace = async (
  skillName: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 5
): Promise<GeneratedQuestion[]> => {
  try {
    const prompt = `Generate ${count} multiple choice questions about ${skillName} at ${difficulty} level. Format as JSON array with question_text, option_a, option_b, option_c, option_d, correct_answer fields.`;
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse and format response (simplified)
    return generateFallbackQuestions(skillName, difficulty, count);
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return generateFallbackQuestions(skillName, difficulty, count);
  }
};

// Fallback: Template-based question generation
export const generateFallbackQuestions = (
  skillName: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): GeneratedQuestion[] => {
  const templates = {
    easy: [
      {
        question_text: `What is the primary purpose of ${skillName}?`,
        option_a: `To manage ${skillName} systems`,
        option_b: `To develop ${skillName} applications`,
        option_c: `To test ${skillName} functionality`,
        option_d: `To deploy ${skillName} solutions`,
        correct_answer: 'A' as const
      }
    ],
    medium: [
      {
        question_text: `Which best practice should be followed when working with ${skillName}?`,
        option_a: `Always use default settings`,
        option_b: `Follow industry standards and documentation`,
        option_c: `Ignore error handling`,
        option_d: `Skip testing phases`,
        correct_answer: 'B' as const
      }
    ],
    hard: [
      {
        question_text: `What is the most complex aspect of ${skillName} implementation?`,
        option_a: `Basic setup and configuration`,
        option_b: `Advanced optimization and scaling`,
        option_c: `Simple data operations`,
        option_d: `Basic user interface design`,
        correct_answer: 'B' as const
      }
    ]
  };

  const selectedTemplates = templates[difficulty];
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const template = selectedTemplates[i % selectedTemplates.length];
    questions.push({
      ...template,
      difficulty
    });
  }

  return questions;
};