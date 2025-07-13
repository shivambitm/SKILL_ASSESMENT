import { useState, useEffect } from "react";
import { quizApi, questionsApi } from "../services/api";
import type { Question, QuizAttempt, QuizStartResponse } from "../types";

export const useQuiz = (skillId: number) => {
  console.log("🎯 useQuiz hook initialized with skillId:", skillId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>(
    {}
  );
  const [quizAttempt, setQuizAttempt] = useState<
    QuizAttempt | QuizStartResponse | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Constants for quiz timing
  const MAX_QUIZ_TIME = 300; // 5 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(MAX_QUIZ_TIME);

  // Modified timer useEffect that counts down instead of up
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizAttempt && !isCompleted) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-complete quiz when time runs out
            completeQuiz();
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizAttempt, isCompleted]); // Remove completeQuiz from dependencies to avoid the warning

  // Reset timeRemaining when starting a quiz
  const startQuiz = async (limit: number = 10) => {
    console.log("🎯 useQuiz.startQuiz called with:", { skillId, limit });

    // Validate skillId
    if (!skillId || skillId <= 0) {
      const error = "Invalid skill ID provided";
      console.error("❌ Start quiz error:", error);
      setError(error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📝 Fetching questions for skill:", skillId);
      console.log(
        "🌐 API URL will be:",
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5002"
        }/api/questions/quiz/${skillId}`
      );

      // Get questions for the quiz
      const questionsResponse = await questionsApi.getQuizQuestions(
        skillId,
        limit
      );
      console.log("📦 Raw questions response:", questionsResponse);

      const quizQuestions = questionsResponse.data.data.questions;
      console.log("✅ Questions fetched:", quizQuestions.length);

      if (quizQuestions.length === 0) {
        throw new Error("No questions available for this skill");
      }

      console.log("🚀 Starting quiz attempt...");
      // Start quiz attempt
      const quizResponse = await quizApi.startQuiz({ skillId });
      console.log(
        "🔍 Full quiz response:",
        JSON.stringify(quizResponse.data, null, 2)
      );

      const newQuizAttempt = quizResponse.data.data.quizAttempt;
      console.log("✅ Quiz attempt created:", newQuizAttempt);
      console.log("🔍 Quiz attempt keys:", Object.keys(newQuizAttempt || {}));
      console.log("🔍 Quiz attempt ID specifically:", newQuizAttempt?.id);

      // Validate that we have a proper quizAttempt with an ID
      if (!newQuizAttempt || !newQuizAttempt.id) {
        console.error("❌ Invalid quiz attempt object:", {
          exists: !!newQuizAttempt,
          hasId: !!(newQuizAttempt && newQuizAttempt.id),
          idValue: newQuizAttempt?.id,
          idType: typeof newQuizAttempt?.id,
          keys: Object.keys(newQuizAttempt || {}),
          fullObject: newQuizAttempt,
        });
        throw new Error("Failed to create a valid quiz attempt - missing ID");
      }

      console.log("🎉 Quiz started successfully, setting state:");
      console.log("- Questions:", quizQuestions.length);
      console.log("- Quiz attempt:", newQuizAttempt);

      setQuestions(quizQuestions);
      setQuizAttempt(newQuizAttempt);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeElapsed(0);
      setTimeRemaining(MAX_QUIZ_TIME);
      setIsCompleted(false);

      console.log("✨ State updated successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      console.error("❌ Start quiz error:", err);
      console.error("❌ Error details:", {
        message: errorMessage,
        response: (
          err as Error & { response?: { data: unknown; status: number } }
        )?.response?.data,
        status: (err as Error & { response?: { status: number } })?.response
          ?.status,
        url: (err as Error & { config?: { url: string } })?.config?.url,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (answer: "A" | "B" | "C" | "D") => {
    if (!quizAttempt || !questions[currentQuestionIndex]) {
      const error =
        "Cannot submit answer: quizAttempt or current question is undefined";
      console.error(error, { quizAttempt, currentQuestionIndex, questions });
      setError(error);
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));

    try {
      // Ensure we have a valid quizAttempt with an ID before proceeding
      if (!quizAttempt.id) {
        const error = "Cannot submit answer: quizAttemptId is undefined";
        console.error(error, { quizAttempt });
        setError(error);
        return;
      }

      const payload = {
        quizAttemptId: quizAttempt.id,
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        timeTaken: MAX_QUIZ_TIME - timeRemaining, // Use time taken from countdown
      };
      console.log("Submitting answer:", payload);

      await quizApi.submitAnswer(payload);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      console.error("Submit answer error:", err);
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || errorMessage
      );
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const completeQuiz = async () => {
    if (!quizAttempt) {
      const error = "Cannot complete quiz: quizAttempt is undefined";
      console.error(error);
      setError(error);
      return null;
    }

    // Ensure quizAttempt has an ID before proceeding
    if (!quizAttempt.id) {
      const error = "Cannot complete quiz: quizAttemptId is undefined";
      console.error(error, { quizAttempt });
      setError(error);
      return null;
    }

    console.log("Complete quiz - quiz attempt:", quizAttempt);
    console.log("Complete quiz - quiz attempt ID:", quizAttempt.id);

    setIsLoading(true);
    try {
      const payload = {
        quizAttemptId: quizAttempt.id,
        timeTaken: MAX_QUIZ_TIME - timeRemaining, // Use time taken from countdown
      };
      console.log("Completing quiz:", payload);

      const response = await quizApi.completeQuiz(payload);

      setIsCompleted(true);
      return response.data.data.score;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      console.error("Complete quiz error:", err);
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || errorMessage
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizAttempt(null);
    setTimeElapsed(0);
    setTimeRemaining(MAX_QUIZ_TIME);
    setIsCompleted(false);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Formats the time remaining instead of time elapsed
  const formatTimeRemaining = () => {
    return formatTime(timeRemaining);
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  };

  const canCompleteQuiz = () => {
    return getAnsweredCount() === questions.length;
  };

  return {
    questions,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex],
    answers,
    quizAttempt,
    isLoading,
    error,
    timeElapsed,
    timeRemaining,
    isCompleted,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    resetQuiz,
    formatTime,
    formatTimeRemaining,
    getProgress,
    getAnsweredCount,
    isCurrentQuestionAnswered,
    canCompleteQuiz,
  };
};
