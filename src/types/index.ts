// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

// Skill types
export interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Question types
export interface Question {
  id: number;
  skillId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Quiz types
export interface QuizAttempt {
  id: number;
  userId: number;
  skillId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  completedAt: string;
  createdAt: string;
}

export interface QuizStartResponse {
  id: number;
  userId: number;
  skillId: number;
  questions: Question[];
  timeLimit: number;
  createdAt: string;
}

// Report types
export interface UserReport {
  user: User;
  totalQuizzes: number;
  averageScore: number;
  skillBreakdown: Array<{
    skill: Skill;
    attempts: number;
    averageScore: number;
    bestScore: number;
  }>;
}

export interface SkillGapReport {
  skills: Array<{
    skill: Skill;
    averageScore: number;
    totalAttempts: number;
    gap: 'low' | 'medium' | 'high';
  }>;
}

export interface SystemOverview {
  totalUsers: number;
  totalQuizzes: number;
  averageScore: number;
  topSkills: Array<{
    skill: Skill;
    attempts: number;
  }>;
}

export interface Leaderboard {
  period: string;
  users: Array<{
    user: User;
    score: number;
    quizzes: number;
  }>;
}

// Assessment types
export interface AssessmentData {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallRating: number;
  feedback: string;
  recommendations: string[];
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}