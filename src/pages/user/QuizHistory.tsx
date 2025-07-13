import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Trophy, Target } from "lucide-react";
import { quizApi, skillsApi } from "../../services/api";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import Pagination from "../../components/common/Pagination";

const QuizHistory: React.FC = () => {
  const [quizHistory, setQuizHistory] = useState<
    import("../../types").QuizAttempt[]
  >([]);
  const [skills, setSkills] = useState<import("../../types").Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch quiz history
        const historyResponse = await quizApi.getQuizHistory({
          page,
          limit: 10,
          skillId: selectedSkill || undefined,
        });

        setQuizHistory(
          (historyResponse.data.data &&
            historyResponse.data.data.quizHistory) ||
            []
        );
        setTotalPages(
          (historyResponse.data.data &&
            historyResponse.data.data.pagination &&
            historyResponse.data.data.pagination.pages) ||
            1
        );

        // Fetch skills for filter
        if (skills.length === 0) {
          const skillsResponse = await skillsApi.getSkills({
            limit: 100,
            isActive: "true",
          });
          setSkills(
            (skillsResponse.data.data && skillsResponse.data.data.items) || []
          );
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response
        ) {
          // @ts-expect-error: dynamic error shape
          setError(err.response.data?.message || "Failed to load quiz history");
        } else {
          setError("Failed to load quiz history");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, selectedSkill, skills.length]);

  const handleSkillFilter = (skillId: string) => {
    setSelectedSkill(skillId);
    setPage(1);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quiz History</h1>
        <Link
          to="/quiz"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Take New Quiz
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Skill:
          </label>
          <select
            value={selectedSkill}
            onChange={(e) => handleSkillFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            <option value="">All Skills</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Quiz History List with Scrollbar */}
      <div
        className="space-y-4"
        style={{
          maxHeight: "520px",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {quizHistory.length > 0 ? (
          quizHistory.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{quiz.skillName}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBadge(
                        quiz.scorePercentage
                      )}`}
                    >
                      {quiz.scorePercentage}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>
                        {quiz.correctAnswers}/{quiz.totalQuestions} correct
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(quiz.timeTaken)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(quiz.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getScoreColor(
                        quiz.scorePercentage
                      )}`}
                    >
                      {quiz.scorePercentage}%
                    </p>
                    <p className="text-sm text-gray-500">Score</p>
                  </div>
                  {/* Remove View Details button if quiz details are not available or failed */}
                  {quiz.scorePercentage !== undefined &&
                  quiz.totalQuestions > 0 &&
                  quiz.correctAnswers >= 0 &&
                  quiz.skillName ? null : (
                    <></>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Quiz History
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't taken any quizzes yet.
              </p>
              <Link
                to="/quiz"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Your First Quiz
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default QuizHistory;
