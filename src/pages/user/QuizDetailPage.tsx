import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { quizApi } from "../../services/api";
import type { QuizAttempt, QuizAnswer } from "../../types";

const QuizDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizAttempt, setQuizAttempt] = useState<
    (QuizAttempt & { answers?: QuizAnswer[] }) | null
  >(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    quizApi
      .getQuizDetails(Number(id))
      .then((res) => {
        setQuizAttempt(res.data.data.quizAttempt);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load quiz details"
        );
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;
  if (!quizAttempt)
    return <div className="p-6 text-center">No data found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Quiz Attempt Details</h1>
      <div className="mb-4">
        <div>
          <b>Skill:</b> {quizAttempt.skillName}
        </div>
        <div>
          <b>Score:</b> {quizAttempt.correctAnswers} /{" "}
          {quizAttempt.totalQuestions} ({quizAttempt.scorePercentage}%)
        </div>
        <div>
          <b>Time Taken:</b> {quizAttempt.timeTaken} seconds
        </div>
        <div>
          <b>Started At:</b>{" "}
          {quizAttempt.startedAt
            ? new Date(quizAttempt.startedAt).toLocaleString()
            : "-"}
        </div>
        <div>
          <b>Completed At:</b>{" "}
          {quizAttempt.completedAt
            ? new Date(quizAttempt.completedAt).toLocaleString()
            : "-"}
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Answers</h2>
      <div className="space-y-4">
        {quizAttempt.answers && quizAttempt.answers.length > 0 ? (
          quizAttempt.answers.map((ans, idx) => (
            <div
              key={ans.questionId}
              className={`border rounded p-4 ${
                ans.isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
            >
              <div className="font-medium mb-1">
                Q{idx + 1}: {ans.questionText}
              </div>
              <ul className="mb-1">
                {Object.entries(ans.options).map(([key, value]) => (
                  <li
                    key={key}
                    className={`ml-2 ${
                      ans.selectedAnswer === key ? "font-bold underline" : ""
                    } ${ans.correctAnswer === key ? "text-green-600" : ""}`}
                  >
                    {key}: {value as string}
                  </li>
                ))}
              </ul>
              <div>
                <span className="mr-2">
                  Your Answer: <b>{ans.selectedAnswer}</b>
                </span>
                <span className="mr-2">
                  Correct Answer: <b>{ans.correctAnswer}</b>
                </span>
                <span>Time: {ans.timeTaken}s</span>
              </div>
              <div
                className={`mt-1 ${
                  ans.isCorrect ? "text-green-700" : "text-red-700"
                }`}
              >
                {ans.isCorrect ? "Correct" : "Incorrect"}
              </div>
            </div>
          ))
        ) : (
          <div>No answers found.</div>
        )}
      </div>
      <div className="mt-6">
        <Link to="/history" className="text-blue-600 hover:underline">
          &larr; Back to History
        </Link>
      </div>
    </div>
  );
};

export default QuizDetailPage;
