import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { User, Skill, Question, QuizAttempt } from "../../types";
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

  // State for managing different views
  const [activeView, setActiveView] = useState<"skills" | "questions">(
    "skills"
  );

  // Users and attempts management
  const [users, setUsers] = useState<User[]>([]);
  const [quizStats, setQuizStats] = useState<any>(null);

  // Skills management
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Questions management
  const [questions, setQuestions] = useState<Question[]>([]);

  // Dashboard stats
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<any[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [userQuizGraph, setUserQuizGraph] = useState<any[]>([]);

  // Modal states
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Loading and error states
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

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch users and stats
      const [usersRes, statsRes, skillsRes, recentRes, perfRes, trendRes] =
        await Promise.all([
          api.get("/admin/users"),
          adminDashboardApi.getQuizStats(),
          api.get("/admin/skills"),
          adminDashboardApi.getRecentQuizzes(),
          adminDashboardApi.getSkillPerformance(),
          adminDashboardApi.getPerformanceTrend(),
        ]);
      setUsers(usersRes.data.data.users || []);
      setQuizStats(statsRes.data);
      setSkills(skillsRes.data.data.skills || []);
      setRecentQuizzes(recentRes.data.recent || []);
      setSkillPerformance(perfRes.data.skills || []);
      setPerformanceTrend(trendRes.data.trend || []);

      // For the graph: build an array of { label, users, quizzes }
      setUserQuizGraph([
        {
          label: "Current",
          users: usersRes.data.data.users?.length || 0,
          quizzes: statsRes.data?.totalQuizzes || 0,
        },
      ]);
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

  // --- Renderers ---

  const statCards = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Total Users",
      value: users.length,
      color: "bg-gradient-to-r from-indigo-500 to-blue-600",
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      label: "Total Quizzes",
      value: quizStats?.totalQuizzes ?? 0,
      color: "bg-gradient-to-r from-pink-500 to-purple-600",
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Best Score",
      value: quizStats?.best?.score ?? "—",
      sub: quizStats?.best?.name ?? "",
      color: "bg-gradient-to-r from-yellow-400 to-orange-500",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      label: "Accuracy Rate",
      value: quizStats?.accuracyRate
        ? quizStats.accuracyRate.toFixed(2) + "%"
        : "—",
      color: "bg-gradient-to-r from-green-400 to-emerald-600",
    },
  ];

  const renderStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, idx) => (
        <div
          key={idx}
          className={`rounded-xl shadow-md overflow-hidden ${stat.color} text-white flex items-center p-6`}
        >
          <div className="p-3 rounded-lg bg-white/20">{stat.icon}</div>
          <div className="ml-4">
            <div className="text-sm font-medium opacity-90">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.sub && <div className="text-xs opacity-80">{stat.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderUserQuizGraph = () => (
    <div className="mb-8 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-white">
        Users vs Quizzes
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={userQuizGraph}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="label" stroke="#bbb" />
          <YAxis stroke="#bbb" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#222",
              color: "#fff",
              borderColor: "#444",
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
    </div>
  );

  const renderRecentQuizzes = () => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2 text-white">Recent Quizzes</h2>
      <div className="overflow-x-auto custom-scrollbar rounded-lg bg-gradient-to-r from-gray-900 to-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-200">
              <th className="p-2 font-semibold">Username</th>
              <th className="p-2 font-semibold">Quiz Name</th>
              <th className="p-2 font-semibold">Skill</th>
              <th className="p-2 font-semibold">Score %</th>
              <th className="p-2 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentQuizzes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No recent quizzes
                </td>
              </tr>
            ) : (
              recentQuizzes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-700 transition">
                  <td className="p-2 text-gray-100">{q.username}</td>
                  <td className="p-2 text-gray-100">{q.name}</td>
                  <td className="p-2 text-gray-100">{q.skill_name}</td>
                  <td className="p-2 text-gray-100">
                    {q.percentage ? q.percentage.toFixed(2) : "—"}
                  </td>
                  <td className="p-2 text-gray-100">
                    {new Date(q.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSkillPerformance = () => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2 text-white">
        Skill Performance
      </h2>
      <div className="overflow-x-auto custom-scrollbar rounded-lg bg-gradient-to-r from-gray-900 to-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-200">
              <th className="p-2 font-semibold">Skill</th>
              <th className="p-2 font-semibold">Times Taken</th>
            </tr>
          </thead>
          <tbody>
            {skillPerformance.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-400">
                  No skill data
                </td>
              </tr>
            ) : (
              skillPerformance.map((s) => (
                <tr key={s.id} className="hover:bg-gray-700 transition">
                  <td className="p-2 text-gray-100">{s.name}</td>
                  <td className="p-2 text-gray-100">{s.times_taken}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPerformanceTrend = () => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2 text-white">
        Performance Trend (Recent)
      </h2>
      <div className="overflow-x-auto custom-scrollbar rounded-lg bg-gradient-to-r from-gray-900 to-gray-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-200">
              <th className="p-2 font-semibold">Username</th>
              <th className="p-2 font-semibold">Score</th>
              <th className="p-2 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {performanceTrend.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-400">
                  No trend data
                </td>
              </tr>
            ) : (
              performanceTrend.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-700 transition">
                  <td className="p-2 text-gray-100">{t.username}</td>
                  <td className="p-2 text-gray-100">{t.score}</td>
                  <td className="p-2 text-gray-100">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Welcome, Admin!</h1>
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
          {renderStatCards()}
          {renderUserQuizGraph()}
          {renderRecentQuizzes()}
          {renderSkillPerformance()}
          {renderPerformanceTrend()}
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
                  <h2 className="text-xl font-bold text-white">
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
      {/* Skill Modal */}
      <Modal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title={selectedSkill ? "Edit Skill" : "Add New Skill"}
      >
        {/* Add skill form component here */}
      </Modal>
      {/* Question Modal */}
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
