/**
 * API Service Layer - Frontend API Client
 *
 * This service provides a centralized API client for the Skill Assessment Portal.
 * It handles all HTTP requests to the backend, including authentication,
 * error handling, and request/response interceptors.
 *
 * Features:
 * - Axios-based HTTP client with proper configuration
 * - Automatic JWT token attachment for authenticated requests
 * - Request/response interceptors for error handling
 * - Comprehensive API endpoints for all application features
 * - TypeScript interfaces for type safety
 * - Centralized error handling and logging
 *
 * API Modules:
 * - authApi: Authentication and user management
 * - skillsApi: Skills CRUD operations
 * - questionsApi: Questions management
 * - quizApi: Quiz operations (start, answer, complete)
 * - reportsApi: Performance reports and analytics
 * - usersApi: User management (admin only)
 *
 * @module ApiService
 * @requires axios for HTTP requests
 * @requires localStorage for token storage
 */

import axios from "axios";
import type {
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  User,
  Skill,
  Question,
  QuizAttempt,
  QuizStartResponse,
  UserReport,
  SkillGapReport,
  SystemOverview,
  Leaderboard,
  AssessmentData,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, ""); // remove trailing slash

console.log("API Base URL from ENV FILE:", API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests (avoid logging in production)
    if (import.meta.env.DEV) {
      console.log(
        `Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data || {}
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const timestamp = new Date().toISOString();
    if (error.response?.status === 401) {
      console.error(
        `[${timestamp}] Unauthorized access detected. Redirecting to login.`
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      console.error(
        `[${timestamp}] Forbidden:`,
        error.response?.data?.message || "Access denied"
      );
      alert("You do not have permission to perform this action.");
    } else if (error.response?.status === 500) {
      console.error(
        `[${timestamp}] Server Error:`,
        error.response?.data?.message || "Internal server error"
      );
      alert("An error occurred on the server. Please try again later.");
    } else {
      console.error(`[${timestamp}] API Error:`, error);
    }
    return Promise.reject(error);
  }
);

// Auth API

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user";
    adminPasscode?: string;
  }) => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response;
    } catch (error: any) {
      if (error.response?.data?.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error("Email already exists. Please use a different email.");
      }
      throw error;
    }
  },

  login: (data: { email: string; password: string }) => {
    return api.post<AuthResponse>("/auth/login", data);
  },

  getCurrentUser: () => api.get<ApiResponse<{ user: User }>>("/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<null>>("/auth/change-password", data),

  // Temporary debug endpoint

  debugResetPassword: (data: { newPassword: string }) =>
    api.post<ApiResponse<null>>("/auth/debug-reset-password", data),
};

// Merged DB + Seed skills/questions for admin
export const adminSeedMergeApi = {
  getMergedSkillsQuestions: () => api.get("/admin/merged-skills-questions"),
};

// Users API
export const usersApi = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => api.get<PaginatedResponse<User>>("/users", { params }),

  getUser: (id: number) => api.get<ApiResponse<{ user: User }>>(`/users/${id}`),

  updateUser: (id: number, data: Partial<User>) =>
    api.put<ApiResponse<null>>(`/users/${id}`, data),

  updateProfile: (data: {
    firstName: string;
    lastName: string;
    email: string;
  }) => api.put<ApiResponse<{ user: User }>>("/users/profile", data),

  deleteUser: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}`),

  getUserStats: () =>
    api.get<ApiResponse<Record<string, unknown>>>("/users/stats/overview"),
};

// Skills API
export const skillsApi = {
  getSkills: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: string;
  }) => api.get<PaginatedResponse<Skill>>("/skills", { params }),

  getSkill: (id: number) =>
    api.get<ApiResponse<{ skill: Skill }>>(`/skills/${id}`),

  createSkill: (data: {
    name: string;
    description: string;
    category: string;
  }) => api.post<ApiResponse<{ skill: Skill }>>("/skills", data),

  updateSkill: (id: number, data: Partial<Skill>) =>
    api.put<ApiResponse<null>>(`/admin/skills/${id}`, data), // admin endpoint

  deleteSkill: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/skills/${id}`), // admin endpoint

  getAllSkillsWithQuestions: () => api.get("/admin/skills-with-questions"), // admin endpoint

  deleteQuestion: (skillId: number, questionId: number) =>
    api.delete(`/admin/skills/${skillId}/questions/${questionId}`), // admin endpoint

  getCategories: () =>
    api.get<ApiResponse<{ categories: string[] }>>("/skills/categories/list"),
};

// Questions API
export const questionsApi = {
  getQuestions: (params?: {
    page?: number;
    limit?: number;
    skillId?: string;
    difficulty?: string;
    search?: string;
  }) => api.get<PaginatedResponse<Question>>("/questions", { params }),

  getQuestion: (id: number) =>
    api.get<ApiResponse<{ question: Question }>>(`/questions/${id}`),

  createQuestion: (data: {
    skillId: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: "A" | "B" | "C" | "D";
    difficulty: "easy" | "medium" | "hard";
    points: number;
  }) => api.post<ApiResponse<{ question: Question }>>("/questions", data),

  updateQuestion: (id: number, data: Partial<Question>) =>
    api.put<ApiResponse<null>>(`/questions/${id}`, data),

  deleteQuestion: (id: number) =>
    api.delete<ApiResponse<null>>(`/questions/${id}`),

  getQuizQuestions: (skillId: number, limit?: number) =>
    api.get<ApiResponse<{ questions: Question[] }>>(
      `/questions/quiz/${skillId}`,
      { params: { limit } }
    ),
};

// Quiz API
export const quizApi = {
  startQuiz: (data: { skillId: number }) => {
    console.log("Starting quiz for skill:", data);
    return api.post<ApiResponse<{ quizAttempt: QuizStartResponse }>>(
      "/quiz/start",
      data
    );
  },

  submitAnswer: (data: {
    quizAttemptId: number;
    questionId: number;
    selectedAnswer: "A" | "B" | "C" | "D";
    timeTaken?: number;
  }) => {
    // Validate required fields before making the request
    if (!data.quizAttemptId) {
      console.error("submitAnswer called with invalid quizAttemptId:", data);
      return Promise.reject(new Error("quizAttemptId is required"));
    }

    console.log("Submitting answer:", data);
    return api.post<
      ApiResponse<{ isCorrect: boolean; correctAnswer: "A" | "B" | "C" | "D" }>
    >("/quiz/answer", data);
  },

  completeQuiz: (data: { quizAttemptId: number; timeTaken?: number }) => {
    // Validate required fields before making the request
    if (!data.quizAttemptId) {
      console.error("completeQuiz called with invalid quizAttemptId:", data);
      return Promise.reject(new Error("quizAttemptId is required"));
    }

    console.log("Completing quiz:", data);
    return api.post<
      ApiResponse<{
        score: {
          scorePercentage: number;
          correctAnswers: number;
          totalQuestions: number;
          timeTaken: number;
        };
      }>
    >("/quiz/complete", data);
  },

  getQuizHistory: (params?: {
    page?: number;
    limit?: number;
    skillId?: string;
  }) => api.get<PaginatedResponse<QuizAttempt>>("/quiz/history", { params }),

  getQuizDetails: (id: number) =>
    api.get<ApiResponse<{ quizAttempt: QuizAttempt }>>(`/quiz/${id}`),
};

// Reports API
export const reportsApi = {
  getUserReport: (userId: number, period?: string) =>
    api.get<ApiResponse<UserReport>>(`/reports/user/${userId}`, {
      params: { period },
    }),

  getSkillGaps: () =>
    api.get<ApiResponse<SkillGapReport>>("/reports/skill-gaps"),

  getSystemOverview: () =>
    api.get<ApiResponse<SystemOverview>>("/reports/overview"),

  getLeaderboard: (params?: {
    period?: string;
    skillId?: string;
    limit?: number;
  }) => api.get<ApiResponse<Leaderboard>>("/reports/leaderboard", { params }),
};

/**
 * Admin API endpoints for managing assessments
 */
export const adminApi = {
  addQuestion: (data: {
    skill_id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    difficulty: string;
    is_active: number;
  }) => api.post("/admin/questions", data),
  // Skills management
  getAllSkills: () => api.get("/admin/skills"),
  createSkill: (data: Partial<Skill>) => api.post("/admin/skills", data),
  updateSkill: (
    id: number,
    data: { name: string; description: string; category: string }
  ) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id: number) => api.delete(`/admin/skills/${id}`),

  // Questions management
  getQuestionsForSkill: (skillId: number) =>
    api.get(`/admin/skills/${skillId}/questions`),
  createQuestion: (skillId: number, data: Partial<Question>) =>
    api.post(`/admin/skills/${skillId}/questions`, data),
  updateQuestion: (
    id: number,
    data: {
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      difficulty: string;
      is_active: number;
    }
  ) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`),

  // Assessment management
  assessQuizAttempt: (attemptId: number, assessmentData: AssessmentData) =>
    api.post(`/admin/attempts/${attemptId}/assess`, {
      assessmentData,
    }),
  getQuizAttempts: (userId: number) =>
    api.get(`/admin/users/${userId}/attempts`),
  getAllQuizAttempts: () => api.get("/admin/attempts"),
  getUserReport: (userId: number) => api.get(`/admin/users/${userId}/report`),
  getAllUserReports: () => api.get("/admin/reports"),

  // Admin: Send notification to user
  sendNotification: (userId: number, message: string) =>
    api.post("/notify", { userId, message }),
};

// Admin Dashboard Stats API
export const adminDashboardApi = {
  getSummary: () => api.get("/admin/summary"),
  getQuizStats: () => api.get("/reports/overview"),
  getRecentQuizzes: () => api.get("/reports/quiz-usage"),
  getSkillPerformance: () => api.get("/reports/quiz-usage"),
  getPerformanceTrend: () => api.get("/reports/quiz-usage"),
};

export default api;

// Import a seed-only question into the DB (admin)
export const importApi = {
  importSeedQuestion: (question: Question) =>
    api.post("/admin/import-seed-question", question),
};
