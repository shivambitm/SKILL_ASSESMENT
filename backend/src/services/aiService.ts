import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;

export interface GeneratedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export const generateQuestions = async (
  skillName: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 5
): Promise<GeneratedQuestion[]> => {
  if (!model) {
    throw new Error('Google AI API key not configured');
  }
  
  try {
    const prompt = `Generate ${count} multiple-choice questions for the skill: "${skillName}".
    
Requirements:
- Difficulty level: ${difficulty}
- Each question should have 4 options (A, B, C, D)
- Only one correct answer
- Questions should be practical and test real understanding
- Include brief explanation for correct answer

Respond with ONLY valid JSON array:
[
  {
    "question_text": "Question here?",
    "option_a": "Option A",
    "option_b": "Option B", 
    "option_c": "Option C",
    "option_d": "Option D",
    "correct_answer": "A",
    "difficulty": "${difficulty}",
    "explanation": "Brief explanation"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) throw new Error('No response from AI');

    // Clean the response to extract JSON
    const jsonMatch = content.match(/\[.*\]/s);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    
    const questions = JSON.parse(jsonString);
    return questions;
  } catch (error) {
    console.error('AI Question Generation Error:', error);
    throw new Error('Failed to generate questions with AI');
  }
};