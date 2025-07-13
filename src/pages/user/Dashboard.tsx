/**
 * Dashboard Component - User Performance Overview
 *
 * The main dashboard provides users with a comprehensive overview of their
 * performance in the skill assessment system. This component displays:
 *
 * Features:
 * - Performance statistics (total quizzes, average score, best score)
 * - Recent quiz history with scores and completion dates
 * - Available skills for quick quiz access
 * - Performance trend charts using Recharts
 * - Responsive design with theme support
 *
 * Data Sources:
 * - User performance data from reports API
 * - Available skills from skills API
 * - Real-time updates when new quizzes are completed
 *
 * Theme Integration:
 * - Supports multiple themes (light, dark, premium, anime)
 * - Uses CSS custom properties for consistent styling
 * - Responsive layout for mobile and desktop
 *
 * @component Dashboard
 * @route /dashboard
 * @requires AuthContext for user authentication
 * @requires ThemeContext for theme management
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, BookOpen, Target } from "lucide-react";

import type { Skill } from "../../types";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { reportsApi, skillsApi } from "../../services/api";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";

// Define types for user report, quiz, and skill
interface Quiz {
  id: string;
  skillName: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  completedAt: string;
}

interface UserReport {
  statistics?: {
    totalQuizzes?: number;
    averageScore?: number;
    bestScore?: number;
    accuracyRate?: number;
  };
  recentQuizzes?: Quiz[];
  skillPerformance?: { skillName: string; score: number }[];
  performanceTrend?: { date: string; avgScore: number }[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  useTheme();
  const [userReport, setUserReport] = useState<UserReport>({});
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skillUsage, setSkillUsage] = useState<
    { skillName: string; count: number; bestScore: number }[]
  >([]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!user) return;
        // Fetch user report
        const reportResponse = await reportsApi.getUserReport(user.id);
        setUserReport((reportResponse.data.data as UserReport) || {});
        // Fetch available skills
        const skillsResponse = await skillsApi.getSkills({
          limit: 10,
          isActive: "true",
        });
        const apiSkills = skillsResponse.data.data.items || [];
        setSkills(apiSkills);
        // Fetch skill usage stats (only for non-admins)
        if (user.role !== "admin") {
          const usageResp = await fetch(
            `/api/reports/user/${user.id}/skill-usage`
          );
          if (usageResp.ok) {
            const usageData = await usageResp.json();
            setSkillUsage(usageData.data || []);
          }
        }
      } catch (err: Error | unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(
          error.response?.data?.message || "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorMessage
          message="No user found. Please log in again."
          className="text-center"
        />
      </div>
    );
  }

  const recentQuizzes = userReport?.recentQuizzes || [];
  const performanceTrend = userReport?.performanceTrend || [];
  // Calculate average score from recentQuizzes (like profile)
  const allScores = recentQuizzes
    .map((q) => q.score)
    .filter((s) => typeof s === "number");
  const averageScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;
  const stats = {
    ...userReport?.statistics,
    averageScore: Number(averageScore.toFixed(2)),
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ...existing code... */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Welcome, {user?.firstName}!
        </h1>
        {!isAdmin && (
          <Link to="/quiz">
            <Button variant="primary">Take Quiz</Button>
          </Link>
        )}
      </div>

      {/* ...existing code for stats cards, skill performance, performance trend, recent quizzes, available skills... */}
      {/* Stat cards removed for admin users as requested */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: BookOpen,
              label: "Total Quizzes",
              value: stats.totalQuizzes ?? 0,
              suffix: "",
            },
            {
              icon: Trophy,
              label: "Average Score",
              value: stats.averageScore,
              suffix: "%",
            },
            {
              icon: Target,
              label: "Best Score",
              value: stats.bestScore ?? 0,
              suffix: "%",
            },
            {
              icon: TrendingUp,
              label: "Accuracy Rate",
              value: stats.accuracyRate ?? 0,
              suffix: "%",
            },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="theme-transition rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="p-6"
                  style={{
                    background: "linear-gradient(to right, #3b82f6, #2563eb)",
                    color: "#fff",
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium opacity-90">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">
                        {stat.value}
                        {stat.suffix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ...existing code for skill performance and performance trend... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend (left) */}
        <Card>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Performance Trend
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
            {performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="var(--accent-color)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="text-center py-8"
                style={{ color: "var(--text-secondary)" }}
              >
                No performance data available
              </div>
            )}
          </div>
        </Card>
        {/* Skill Performance (right, only for non-admins) */}
        {!isAdmin && (
          <Card>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Skill Performance
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--text-secondary)" }}>
                      <th className="px-2 py-1 text-left">Skill</th>
                      <th className="px-2 py-1 text-right">Times Taken</th>
                      <th className="px-2 py-1 text-right">Best Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillUsage.length > 0 ? (
                      skillUsage.map((row) => (
                        <tr key={row.skillName}>
                          <td className="px-2 py-1">{row.skillName}</td>
                          <td className="px-2 py-1 text-right">{row.count}</td>
                          <td className="px-2 py-1 text-right">
                            {row.bestScore}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-4"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          No skill usage data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ...existing code for recent quizzes and available skills... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Quizzes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Quizzes
            </h3>
            <Link
              to="/history"
              style={{ color: "var(--accent-color)" }}
              className="hover:underline text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz: Quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-3 rounded-lg theme-transition"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {quiz.skillName}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {quiz.correctAnswers}/{quiz.totalQuestions} correct
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {quiz.score}%
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {quiz.completedAt
                        ? new Date(quiz.completedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="text-center py-4"
                style={{ color: "var(--text-secondary)" }}
              >
                No recent quizzes
              </div>
            )}
          </div>
        </Card>

        {/* Available Skills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Available Skills
            </h3>
            {!isAdmin && (
              <Link
                to="/quiz"
                style={{ color: "var(--accent-color)" }}
                className="hover:underline text-sm font-medium"
              >
                Take Quiz
              </Link>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
            {skills.length > 0 ? (
              skills.map((skill: Skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 rounded-lg theme-transition"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {skill.name}
                    </p>
                    {skill.description && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {skill.description}
                      </p>
                    )}
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {skill.category}
                    </p>
                  </div>
                  {isAdmin ? null : (
                    <Link
                      to={`/quiz?skill=${skill.id}`}
                      style={{ color: "var(--accent-color)" }}
                      className="hover:underline text-sm font-medium"
                    >
                      Start Quiz
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div
                className="text-center py-4"
                style={{ color: "var(--text-secondary)" }}
              >
                No skills available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
