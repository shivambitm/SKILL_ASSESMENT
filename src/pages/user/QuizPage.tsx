/**
 * Quiz Page Component - Interactive Quiz Interface
 *
 * This component provides the main quiz-taking interface where users can:
 * - Select a skill to test their knowledge
 * - Take timed quizzes with multiple-choice questions
 * - Navigate between questions and track progress
 * - Submit answers and complete quizzes
 * - View results and performance metrics
 *
 * Features:
 * - Real-time timer with 5-minute limit
 * - Question navigation (next/previous)
 * - Progress tracking and completion status
 * - Answer selection with visual feedback
 * - Auto-completion when time runs out
 * - Results display with detailed scoring
 *
 * @component QuizPage
 * @route /quiz
 * @requires useQuiz hook for quiz state management
 * @requires skillsApi for fetching available skills
 */

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { skillsApi } from "../../services/api";
import { useQuiz } from "../../hooks/useQuiz";
import type { Skill } from "../../types";

interface QuizScore {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeTaken: number;
}
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";

const skillListStyles = `
.skill-list-container {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 #f1f5f9;
  max-height: 400px;
}
.skill-list-container::-webkit-scrollbar {
  width: 8px;
}
.skill-list-container::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 4px;
}
.skill-list-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.category-tag {
  background: #e0e7ff;
  color: #3730a3;
  margin-top: 2px;
}
`;

const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<QuizScore | null>(null);

  const skillIdParam = searchParams.get("skill");

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    quizAttempt,
    isLoading: quizLoading,
    error: quizError,
    timeRemaining,
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
  } = useQuiz(selectedSkill || 1); // Use 1 as default to avoid issues, but validate in startQuiz

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await skillsApi.getSkills({
          limit: 100,
          isActive: "true",
        });
        setSkills(response.data.data.items || []);

        // Auto-select skill if provided in URL
        if (skillIdParam) {
          const skillId = parseInt(skillIdParam);
          const skill = (response.data.data.items || []).find(
            (s: Skill) => s.id === skillId
          );
          if (skill) {
            setSelectedSkill(skillId);
          }
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load skills";
        setError(
          err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "message" in err.response.data
            ? String(err.response.data.message)
            : errorMessage
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [skillIdParam]);

  // Keep track of the quizAttempt when it changes
  useEffect(() => {
    if (quizAttempt) {
      console.log("Quiz attempt updated:", quizAttempt);
    }
  }, [quizAttempt]);

  // Reset quiz when skill changes
  useEffect(() => {
    if (selectedSkill) {
      resetQuiz();
      setQuizCompleted(false);
      setFinalScore(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkill]); // Only reset when selectedSkill changes, not when resetQuiz reference changes
  const handleStartQuiz = async () => {
    console.log("🎬 handleStartQuiz called - button clicked!");
    console.log("🎯 Current selectedSkill:", selectedSkill);

    if (!selectedSkill) {
      console.log("❌ No skill selected, aborting");
      return;
    }

    console.log("🚀 Starting quiz for skill:", selectedSkill);

    try {
      console.log("📝 About to call startQuiz function...");
      await startQuiz(10); // Start with 10 questions
      console.log("✅ Quiz started successfully!");

      // Reset completion state when starting a new quiz
      setQuizCompleted(false);
      setFinalScore(null);
    } catch (error) {
      console.error("❌ Failed to start quiz:", error);
      setError("Failed to start quiz. Please try again.");
    }
  };

  const handleAnswerSelect = async (answer: "A" | "B" | "C" | "D") => {
    if (!quizAttempt) {
      console.error("Cannot submit answer: No active quiz attempt", {
        quizAttempt,
      });
      setError("No active quiz attempt. Please restart the quiz.");
      return;
    }
    await submitAnswer(answer);
  };

  const handleCompleteQuiz = async () => {
    if (!quizAttempt) {
      console.error("Cannot complete quiz: No active quiz attempt", {
        quizAttempt,
      });
      setError("No active quiz attempt. Please restart the quiz.");
      return;
    }

    console.log("Attempting to complete quiz with attempt:", quizAttempt);
    const score = await completeQuiz();
    if (score) {
      setFinalScore(score);
      setQuizCompleted(true);
    } else {
      console.error("Failed to complete quiz: No score returned");
    }
  };

  const handleRestartQuiz = () => {
    resetQuiz();
    setQuizCompleted(false);
    setFinalScore(null);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Inject the style block for the scroll bar
  useEffect(() => {
    if (!document.getElementById("skill-list-scrollbar-style")) {
      const style = document.createElement("style");
      style.id = "skill-list-scrollbar-style";
      style.innerHTML = skillListStyles;
      document.head.appendChild(style);
    }
  }, []);

  // Debug logging to see current state
  console.log("🔍 QuizPage render state:", {
    loading,
    error,
    quizCompleted,
    selectedSkill,
    questionsLength: questions.length,
    quizAttempt: quizAttempt?.id,
    finalScore: finalScore?.scorePercentage,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} className="text-center" />;
  }

  // Quiz completed screen
  if (quizCompleted && finalScore) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <Card className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quiz Completed!
            </h2>
            <p className="text-gray-600">Great job! Here are your results:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600">Score</p>
              <p className="text-2xl font-bold text-blue-900">
                {finalScore.scorePercentage}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">
                Correct Answers
              </p>
              <p className="text-2xl font-bold text-green-900">
                {finalScore.correctAnswers}/{finalScore.totalQuestions}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-600">Time Taken</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatTime(finalScore.timeTaken)}
              </p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleRestartQuiz} variant="secondary">
              Take Another Quiz
            </Button>
            <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Quiz in progress - check for valid quiz data from the hook
  if (
    quizAttempt &&
    questions.length > 0 &&
    currentQuestion &&
    !quizCompleted
  ) {
    console.log("📋 Rendering quiz interface");
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        {/* Quiz Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <p className="text-gray-600">
                {getAnsweredCount()} of {questions.length} answered
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 ${
                  timeRemaining < 60
                    ? "text-red-600 font-bold animate-pulse"
                    : ""
                }`}
              >
                <Clock
                  className={`w-5 h-5 ${
                    timeRemaining < 60 ? "text-red-600" : "text-gray-500"
                  }`}
                />
                <span className="text-lg font-mono">
                  {formatTimeRemaining()}
                </span>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Question */}
        <Card className="mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                {currentQuestion.difficulty.charAt(0).toUpperCase() +
                  currentQuestion.difficulty.slice(1)}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {currentQuestion.points} point
                {currentQuestion.points > 1 ? "s" : ""}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {currentQuestion.questionText}
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, option]) => (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key as "A" | "B" | "C" | "D")}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors quiz-option ${
                  answers[currentQuestion.id] === key
                    ? "border-blue-500 bg-blue-50 selected"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-medium option-letter">
                    {key}
                  </span>
                  <span className="option-text">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <Card>
          <div className="flex items-center justify-between">
            <Button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {questions.map((_, index) => {
                const isCurrent = index === currentQuestionIndex;
                const isAnswered = answers[questions[index].id];
                return (
                  <button
                    key={index}
                    className={`w-9 h-9 rounded-full text-base font-extrabold border-2 shadow transition-all duration-150
                      ${
                        isCurrent
                          ? "bg-[var(--accent-color)] text-white border-[var(--accent-hover)] scale-110 shadow-lg"
                          : isAnswered
                          ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border-[var(--accent-color)]"
                          : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-primary)]/40"
                      }
                    `}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex space-x-2">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={nextQuestion}
                  disabled={!isCurrentQuestionAnswered()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCompleteQuiz}
                  disabled={!canCompleteQuiz()}
                  loading={quizLoading}
                >
                  Complete Quiz
                </Button>
              )}
            </div>
          </div>
        </Card>

        {quizError && (
          <Card className="mt-4">
            <ErrorMessage message={quizError} />
          </Card>
        )}
      </div>
    );
  }

  // Show loading state when quiz is starting but not ready yet
  if (quizLoading && selectedSkill) {
    console.log("⏳ Quiz starting - showing loading state");
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <Card className="text-center py-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Preparing your quiz...</p>
        </Card>
      </div>
    );
  }

  // Skill selection screen
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Select a Skill to Test
        </h1>

        <div
          className="skill-list-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          style={{ maxHeight: 400, overflowY: "auto" }}
        >
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill.id)}
              className={`p-4 text-left rounded-lg border-2 transition-colors skill-button ${
                selectedSkill === skill.id
                  ? "border-blue-500 bg-blue-100 selected"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{skill.name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {skill.description || (
                  <span className="italic text-gray-400">No description</span>
                )}
              </p>
              <span className="inline-block px-2 py-1 text-xs font-medium rounded category-tag">
                {skill.category || (
                  <span className="italic text-gray-400">No category</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleStartQuiz}
            disabled={!selectedSkill}
            loading={quizLoading}
            size="lg"
          >
            Start Quiz
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizPage;
