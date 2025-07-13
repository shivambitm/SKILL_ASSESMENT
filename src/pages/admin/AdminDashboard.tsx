import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { User, Skill, Question } from "../../types";
import api, { adminDashboardApi } from "../../services/api";
import { Users, BarChart2, Award, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<"skills" | "questions">(
    "skills"
  );
  // const [users, setUsers] = useState<User[]>([]); // removed unused
  const [summary, setSummary] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  // const [userQuizGraph, setUserQuizGraph] = useState<any[]>([]); // removed unused
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/admin/dashboard");
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Removed unused getUniqueUsernamesCount

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, usersRes, skillsRes, recentRes, perfRes, trendRes] =
        await Promise.all([
          adminDashboardApi.getSummary(),
          api.get("/admin/users"),
          api.get("/admin/skills"),
          adminDashboardApi.getRecentQuizzes(),
          adminDashboardApi.getSkillPerformance(),
          adminDashboardApi.getPerformanceTrend(),
        ]);
      setSummary(summaryRes.data);
      // setUsers(usersRes.data.data || []); // removed unused
      setSkills(skillsRes.data.data.skills || []);
      setRecentQuizzes(recentRes.data.recent || []);
      setSkillPerformance(perfRes.data.skills || []);
      setPerformanceTrend(trendRes.data.trend || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsForSkill = async (skillId: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/skills/${skillId}/questions`);
      setQuestions(res.data.data.questions);
    } catch (err) {
      setError(
        (err as any).response?.data?.message || "Failed to fetch questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    fetchQuestionsForSkill(skill.id);
    setActiveView("questions");
  };

  // Removed unused totalQuizzes

  // Find Best Score and corresponding username
  let bestScore = "—";
  let bestUser = "";
  if (recentQuizzes.length > 0) {
    let max = -1;
    recentQuizzes.forEach((q: any) => {
      if (q.percentage > max) {
        max = q.percentage;
        bestScore = q.percentage ? q.percentage.toFixed(2) + "%" : "—";
        bestUser = q.username || "";
      }
    });
  }

  // Removed unused accuracyRate

  // Use summary data for stat cards (except Best Score)
  const statCards = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Total Users",
      value: summary?.totalUsers ?? "—",
      color: "bg-gradient-to-r from-indigo-500 to-blue-600",
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      label: "Total Quizzes",
      value: summary?.totalQuizzes ?? "—",
      color: "bg-gradient-to-r from-pink-500 to-purple-600",
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Best Score",
      value: bestScore,
      sub: bestUser,
      color: "bg-gradient-to-r from-yellow-400 to-orange-500",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      label: "Accuracy Rate",
      value: summary?.avgScore !== undefined ? `${summary.avgScore}%` : "—",
      color: "bg-gradient-to-r from-green-400 to-emerald-600",
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Welcome, Admin!
        </h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-4 p-4 bg-red-900 text-red-100 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, idx) => (
              <Card
                key={idx}
                className="theme-transition rounded-lg shadow-md overflow-hidden"
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
                    {stat.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.sub && (
                      <p className="text-xs opacity-80">{stat.sub}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 2x2 Grid for Graph, Skill Performance, Recent Quizzes, Performance Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Users vs Quizzes Graph */}
            <Card>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Scores vs Time
              </h3>
              {/* <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userQuizGraph}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--text-secondary)"
                      label={{
                        value: "Type",
                        position: "insideBottom",
                        offset: -5,
                        fill: "var(--text-secondary)",
                      }}
                    />
                    <YAxis
                      stroke="var(--text-secondary)"
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--text-secondary)",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      name="Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="quizzes"
                      stroke="#f472b6"
                      strokeWidth={3}
                      name="Quizzes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div> */}
              {/* Parabolic (Line) Graph */}
              <div className="mb-4 max-h-80 min-h-[200px]">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={performanceTrend.map((t: any) => ({
                      name: t.username,
                      score:
                        typeof t.score === "number" ? t.score : Number(t.score),
                      time: t.created_at,
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="var(--text-secondary)"
                      tickFormatter={(v) => new Date(v).toLocaleDateString()}
                      label={{
                        value: "Time",
                        position: "insideBottom",
                        offset: -5,
                        fill: "var(--text-secondary)",
                      }}
                    />
                    <YAxis
                      stroke="var(--text-secondary)"
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--text-secondary)",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        borderColor: "var(--border-color)",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#34d399"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Skill Performance */}
            <Card>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Skill Performance
              </h3>
              <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-secondary)" }}>
                        <th className="px-2 py-1 text-left">Skill</th>
                        <th className="px-2 py-1 text-right">Times Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillPerformance.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-4"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No skill data
                          </td>
                        </tr>
                      ) : (
                        skillPerformance.map((s: any) => (
                          <tr
                            key={s.id}
                            className="hover:bg-gray-700 transition"
                          >
                            <td className="px-2 py-1">{s.name}</td>
                            <td className="px-2 py-1 text-right">
                              {s.times_taken}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Quizzes */}
            <Card>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Recent Quizzes
              </h3>
              <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-secondary)" }}>
                        <th className="px-2 py-1">Username</th>
                        {/* <th className="px-2 py-1">Quiz Name</th> */}
                        <th className="px-2 py-1">Skill</th>
                        <th className="px-2 py-1">Score %</th>
                        <th className="px-2 py-1">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuizzes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No recent quizzes
                          </td>
                        </tr>
                      ) : (
                        recentQuizzes.map((q: any) => (
                          <tr
                            key={q.id}
                            className="hover:bg-gray-700 transition"
                          >
                            <td className="px-2 py-1">{q.username}</td>
                            {/* <td className="px-2 py-1">{q.name}</td> */}
                            <td className="px-2 py-1">{q.skill_name}</td>
                            <td className="px-2 py-1">
                              {q.percentage ? q.percentage.toFixed(2) : "—"}
                            </td>
                            <td className="px-2 py-1">
                              {new Date(q.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Performance Trend */}
            <Card>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Performance Trend (Recent)
              </h3>

              {/* Table with forced scrollbar */}
              <div className="max-h-500 min-h-[120px] overflow-y-scroll pr-2 scrollbar-thin scrollbar-thumb-[var(--accent-color)] scrollbar-track-[var(--bg-tertiary)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-secondary)" }}>
                        <th className="px-2 py-1">Username</th>
                        <th className="px-2 py-1">Score</th>
                        <th className="px-2 py-1">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceTrend.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="text-center py-4"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No trend data
                          </td>
                        </tr>
                      ) : (
                        performanceTrend.map((t: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-700 transition"
                          >
                            <td className="px-2 py-1">{t.username}</td>
                            <td className="px-2 py-1">{t.score}</td>
                            <td className="px-2 py-1">
                              {new Date(t.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Skills/Questions Section (unchanged) */}
          {activeView === "skills" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <Card
                    key={skill.id}
                    className="cursor-pointer"
                    onClick={() => handleSkillSelect(skill)}
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{skill.name}</h3>
                      <p className="text-gray-400">{skill.description}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        Category: {skill.category}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activeView === "questions" && selectedSkill && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedSkill.name} - Questions
                  </h2>
                  <p className="text-gray-400">{selectedSkill.description}</p>
                </div>
                <div className="space-x-2">
                  <Button onClick={() => setActiveView("skills")}>
                    Back to Skills
                  </Button>
                  <Button onClick={() => setShowQuestionModal(true)}>
                    Add Question
                  </Button>
                </div>
              </div>
              <div className="space-y-4 custom-scrollbar max-h-[400px] overflow-y-auto">
                {questions.map((question) => (
                  <Card key={question.id}>
                    <div className="flex justify-between">
                      <h3 className="text-lg font-semibold">
                        {question.questionText}
                      </h3>
                      <div className="space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            /* handleEditQuestion(question) */
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            /* handleDeleteQuestion(question.id) */
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-2 rounded ${
                            question.correctAnswer === key
                              ? "bg-green-100 border border-green-300"
                              : "bg-gray-50"
                          }`}
                        >
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Difficulty: {question.difficulty} | Points:{" "}
                      {question.points}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <Modal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title={selectedSkill ? "Edit Skill" : "Add New Skill"}
      >
        {/* Add skill form component here */}
      </Modal>
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title="Add New Question"
      >
        {/* Add question form component here */}
      </Modal>
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #6366f1 #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
