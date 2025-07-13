export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface Question {
  id: number;
  skillId: number;
  skillName?: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: "A" | "B" | "C" | "D";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuizAttempt {
  id: number;
  userId: number;
  skillId: number;
  skillName: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeTaken: number;
  startedAt: string;
  completedAt: string;
  isAssessed: boolean;
  assessedAt?: string;
  assessedBy?: number;
  assessmentNotes?: string;
}

// Partial QuizAttempt for when starting a quiz (before completion)
export type QuizStartResponse = Pick<
  QuizAttempt,
  "id" | "userId" | "skillId" | "skillName" | "totalQuestions" | "startedAt"
>;

export interface QuizAnswer {
  questionId: number;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer: "A" | "B" | "C" | "D";
  correctAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  timeTaken: number;
}

export interface UserReport {
  userId: number;
  userName: string;
  skillId: number;
  skillName: string;
  totalAttempts: number;
  assessedAttempts: number;
  averageScore: number;
  bestScore: number;
  lastAttemptDate: string;
  progress: {
    easy: number;
    medium: number;
    hard: number;
  };
  assessmentStatus: {
    pending: number;
    assessed: number;
  };
}

export interface SkillGapReport {
  skillGaps: {
    skillId: number;
    skillName: string;
    category: string;
    usersAttempted: number;
    totalAttempts: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
    participationRate: number;
    gapLevel: "high" | "medium" | "low";
  }[];
  difficultyAnalysis: {
    difficulty: string;
    totalQuestions: number;
    successRate: number;
    usersAttempted: number;
  }[];
  categoryPerformance: {
    category: string;
    skillCount: number;
    avgScore: number;
    usersAttempted: number;
  }[];
}

export interface SystemOverview {
  basicStatistics: {
    totalUsers: number;
    totalSkills: number;
    totalQuestions: number;
    totalQuizAttempts: number;
  };
  recentActivity: {
    recentAttempts: number;
    activeUsers: number;
    avgRecentScore: number;
  };
  dailyActivity: {
    date: string;
    quizCount: number;
    uniqueUsers: number;
    avgScore: number;
  }[];
  topUsers: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    quizCount: number;
    avgScore: number;
  }[];
  challengingSkills: {
    id: number;
    name: string;
    attempts: number;
    avgScore: number;
  }[];
}

export interface Leaderboard {
  leaderboard: {
    rank: number;
    id: number;
    firstName: string;
    lastName: string;
    quizCount: number;
    avgScore: number;
    bestScore: number;
    accuracyRate: number;
  }[];
  period: string;
  skillId: number | null;
}

export interface AssessmentData {
  notes: string;
  score?: number;
  feedback?: string;
}

export interface AssessmentRequest {
  attemptId: number;
  assessmentData: AssessmentData;
}

export interface AssessmentResponse {
  success: boolean;
  message: string;
  data: {
    attempt: QuizAttempt;
  };
}
