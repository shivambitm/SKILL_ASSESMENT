import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Target } from "lucide-react";
import { reportsApi, skillsApi } from "../../services/api";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { Leaderboard as LeaderboardType, Skill } from "../../types";

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<
    LeaderboardType["leaderboard"]
  >([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch leaderboard
        const leaderboardResponse = await reportsApi.getLeaderboard({
          period: selectedPeriod,
          skillId: selectedSkill || undefined,
          limit: 20,
        });

        const lb = leaderboardResponse.data?.data?.leaderboard;
        setLeaderboard(Array.isArray(lb) ? lb : []);

        // Fetch skills for filter
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
          const skillsResponse = await skillsApi.getSkills({
            limit: 100,
            isActive: "true",
          });
          setSkills(skillsResponse.data?.data?.items || []);
        }
      } catch (err: unknown) {
        if (typeof err === "object" && err !== null && "response" in err) {
          // @ts-expect-error error shape from axios is not typed
          setError(err.response?.data?.message || "Failed to load leaderboard");
        } else {
          setError("Failed to load leaderboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedSkill, skills]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">
            #{rank}
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const isCurrentUser = (userId: number) => {
    return user?.id === userId;
  };

  // Add this style block for premium theme highlights (only once, at the top)
  const premiumLeaderboardStyles = `
  .premium-leaderboard-row {
    border: 2px solid #6366f1 !important;
    background: linear-gradient(90deg, #23234f 0%, #1a1a2e 100%) !important;
    color: #fff !important;
  }
  .premium-leaderboard-row.top-1 {
    background: linear-gradient(90deg, #fbbf24 0%, #f59e42 100%) !important;
    color: #1a1a2e !important;
    font-weight: bold;
  }
  .premium-leaderboard-row.top-2 {
    background: linear-gradient(90deg, #a5b4fc 0%, #6366f1 100%) !important;
    color: #23234f !important;
    font-weight: bold;
  }
  .premium-leaderboard-row.top-3 {
    background: linear-gradient(90deg, #fdba74 0%, #f59e42 100%) !important;
    color: #23234f !important;
    font-weight: bold;
  }
  .premium-leaderboard-row.current-user {
    background: linear-gradient(90deg, #38bdf8 0%, #6366f1 100%) !important;
    color: #fff !important;
    font-weight: bold;
  }
  `;

  useEffect(() => {
    if (
      theme === "premium" &&
      !document.getElementById("premium-leaderboard-style")
    ) {
      const style = document.createElement("style");
      style.id = "premium-leaderboard-style";
      style.innerHTML = premiumLeaderboardStyles;
      document.head.appendChild(style);
    }
  }, [theme, premiumLeaderboardStyles]);

  // Defensive: If leaderboard or skills is undefined/null, show fallback

  // Defensive: If leaderboard or skills is undefined/null, show fallback
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

  if (!Array.isArray(leaderboard)) {
    return (
      <ErrorMessage
        message="Leaderboard data is unavailable."
        className="text-center"
      />
    );
  }
  if (!Array.isArray(skills)) {
    return (
      <ErrorMessage
        message="Skills data is unavailable."
        className="text-center"
      />
    );
  }

  // (removed duplicate declaration and effect)

  return (
    <div
      className={`space-y-6${
        theme === "premium" ? " premium-leaderboard-bg" : ""
      }`}
    >
      {/* add a class for premium theme */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span className="text-sm text-gray-600">Top Performers</span>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leaderboard-select"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Skill:</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leaderboard-select"
            >
              <option value="">All Skills</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      {/* Top Performer Podium - Glassmorphism, Avatars, Extra Stats, Profile Links */}
      {Array.isArray(leaderboard) && leaderboard.length >= 3 ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center justify-end w-32">
            <div className="w-16 h-16 rounded-full border-4 border-gray-400 bg-white flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-gray-700">
                {leaderboard[1].firstName.charAt(0)}
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {leaderboard[1].firstName} {leaderboard[1].lastName}
            </div>
            <div className="text-sm text-gray-500">
              {leaderboard[1].avgScore}% Avg
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-bold">
              #2
            </div>
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center justify-end w-40">
            <div className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-white flex items-center justify-center mb-2 shadow-xl">
              <span className="text-3xl font-extrabold text-yellow-600">
                {leaderboard[0].firstName.charAt(0)}
              </span>
            </div>
            <div className="text-xl font-bold text-yellow-700">
              {leaderboard[0].firstName} {leaderboard[0].lastName}
            </div>
            <div className="text-base text-yellow-600">
              {leaderboard[0].avgScore}% Avg
            </div>
            <div className="mt-2 px-4 py-1 rounded-full bg-yellow-200 text-yellow-800 font-extrabold">
              #1
            </div>
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center justify-end w-32">
            <div className="w-16 h-16 rounded-full border-4 border-orange-400 bg-white flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-orange-700">
                {leaderboard[2].firstName.charAt(0)}
              </span>
            </div>
            <div className="text-lg font-semibold text-orange-700">
              {leaderboard[2].firstName} {leaderboard[2].lastName}
            </div>
            <div className="text-sm text-orange-500">
              {leaderboard[2].avgScore}% Avg
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-orange-200 text-orange-800 font-bold">
              #3
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Not enough data for podium
          </h3>
          <p className="text-gray-600">
            At least 3 users must have quiz results to show the top performers
            podium.
          </p>
        </div>
      )}
      {/* Full Leaderboard */}
      <Card
        className={theme === "premium" ? "premium-leaderboard-card" : ""}
        style={
          theme === "premium"
            ? {
                background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)",
                color: "#fff",
                borderColor: "#6366f1",
              }
            : {}
        }
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={theme === "premium" ? { color: "#fff" } : {}}
        >
          Full Leaderboard
        </h2>
        {/* Smooth scrollable leaderboard list */}
        <div
          className="space-y-3 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: 400 }}
        >
          {leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors duration-300
                  ${
                    theme === "premium"
                      ? `premium-leaderboard-row${
                          entry.rank === 1
                            ? " top-1"
                            : entry.rank === 2
                            ? " top-2"
                            : entry.rank === 3
                            ? " top-3"
                            : isCurrentUser(entry.id)
                            ? " current-user"
                            : ""
                        }`
                      : isCurrentUser(entry.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }
                `}
                style={
                  theme === "premium"
                    ? {
                        background: "rgba(30, 41, 59, 0.85)",
                        borderColor: "#6366f1",
                        color: "#fff",
                        boxShadow: "0 2px 16px 0 rgba(99,102,241,0.15)",
                      }
                    : {}
                }
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getRankBadge(
                      entry.rank
                    )}`}
                  >
                    {getRankIcon(entry.rank)}
                  </div>

                  <div>
                    <p
                      className={
                        `font-semibold text-gray-900 dark:text-white` +
                        (isCurrentUser(entry.id)
                          ? " text-blue-900 dark:text-blue-300"
                          : "")
                      }
                      style={{
                        textShadow:
                          "0 1px 8px #fff, 0 0 2px #000, 0 0 2px #fbbf24, 0 0 2px #000",
                        letterSpacing: 0.5,
                      }}
                    >
                      {entry.firstName} {entry.lastName}
                      {isCurrentUser(entry.id) && (
                        <span className="ml-2 text-blue-600 dark:text-blue-300 text-sm">
                          (You)
                        </span>
                      )}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--accent-color)", fontWeight: 600 }}
                    >
                      {entry.quizCount} quizzes taken
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p
                      className="text-sm leaderboard-stat-label"
                      style={
                        theme === "premium"
                          ? {
                              color: "#fbbf24",
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              textShadow:
                                "0 1px 8px #fff, 0 0 2px #fbbf24, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      Average Score
                    </p>
                    <p
                      className="text-lg font-bold leaderboard-stat-value"
                      style={
                        theme === "premium"
                          ? {
                              color: "#fbbf24",
                              textShadow: "0 1px 8px #fff, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      {entry.avgScore}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm leaderboard-stat-label"
                      style={
                        theme === "premium"
                          ? {
                              color: "#34d399",
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              textShadow:
                                "0 1px 8px #fff, 0 0 2px #000, 0 0 2px #34d399, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      Best Score
                    </p>
                    <p
                      className="text-lg font-bold leaderboard-stat-value"
                      style={
                        theme === "premium"
                          ? {
                              color: "#34d399",
                              textShadow: "0 1px 8px #fff, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      {entry.bestScore}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm leaderboard-stat-label"
                      style={
                        theme === "premium"
                          ? {
                              color: "#f472b6",
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              textShadow:
                                "0 1px 8px #fff, 0 0 2px #000, 0 0 2px #f472b6, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      Accuracy
                    </p>
                    <p
                      className="text-lg font-bold leaderboard-stat-value"
                      style={
                        theme === "premium"
                          ? {
                              color: "#f472b6",
                              textShadow: "0 1px 8px #fff, 0 0 2px #000",
                            }
                          : {}
                      }
                    >
                      {entry.accuracyRate}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600">
                No quiz results found for the selected criteria.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;
