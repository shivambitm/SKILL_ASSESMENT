import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { adminApi } from "../../services/api";
// import html2pdf from "html2pdf.js"; // Use CDN/global version instead
// import NotificationBell from "../../components/common/NotificationBell";

interface UserReport {
  id: number;
  username: string;
  email: string;
  registeredAt: string;
  totalQuizzes: number;
  totalCorrect: number;
  avgScore: number;
}

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    console.debug("[AdminReports] useEffect: fetching all user reports");
    adminApi
      .getAllUserReports()
      .then((res) => {
        console.debug("[AdminReports] API response:", res);
        setReports(res.data.reports || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[AdminReports] API error:", err);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      });
  }, []);

  const handleSendNotification = async (userId: number) => {
    try {
      await adminApi.sendNotification(
        userId,
        "Your quiz result has been assessed by HR/Admin."
      );
      setNotification(`Notification sent to user ID ${userId}`);
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      setNotification("Failed to send notification");
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("user-reports-export");
    // @ts-expect-error: html2pdf is loaded globally via CDN, not imported as a module
    const html2pdf = window.html2pdf;
    if (element && html2pdf) {
      html2pdf()
        .from(element)
        .set({
          margin: 0.5,
          filename: "user-result-data.pdf",
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .save();
    } else {
      alert("PDF export is not available. Please try again later.");
    }
  };

  // Theme-aware background for admin reports
  const theme = localStorage.getItem("theme") || "light";
  let cardBg = "";
  if (theme === "premium")
    cardBg =
      "bg-gradient-to-br from-[rgba(139,92,246,0.25)] via-[rgba(15,15,35,0.85)] to-[rgba(75,0,130,0.7)] backdrop-blur-2xl";
  return (
    <Card
      className={`rounded-2xl shadow-2xl border-2 border-[var(--accent-color)] theme-transition ${cardBg}`}
    >
      {/* For best PDF export, use a white background and dark text for the export area */}
      <div id="user-reports-export">
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold text-[var(--accent-color)] drop-shadow-lg font-sans">
            User Reports
          </h2>
        </div>
        {/* Example chart placeholder for PDF export (replace with real chart if needed) */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-full max-w-md rounded-2xl p-4 mb-2 border-2 border-[var(--accent-color)] shadow-lg bg-[rgba(139,92,246,0.10)] backdrop-blur-lg theme-transition">
            <h3 className="text-lg font-bold mb-2 text-[var(--accent-color)] drop-shadow">
              Summary
            </h3>
            <div className="flex justify-between text-sm text-[var(--text-primary)]">
              <div>
                Total Users: <span className="font-bold">{reports.length}</span>
              </div>
              <div>
                Total Quizzes:{" "}
                <span className="font-bold">
                  {reports.reduce((a, b) => a + b.totalQuizzes, 0)}
                </span>
              </div>
              <div>
                Avg. Score:{" "}
                <span className="font-bold">
                  {reports.length > 0
                    ? (
                        reports.reduce((a, b) => a + b.avgScore, 0) /
                        reports.length
                      ).toFixed(2)
                    : "0.00"}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Download Result Data button removed as requested */}
        {notification && (
          <div className="mb-2 text-green-600">{notification}</div>
        )}
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && (
          <div className="overflow-x-auto max-h-[60vh] smooth-scrollbar">
            <table
              id="user-reports-table"
              className="min-w-full border-2 border-[var(--accent-color)] rounded-2xl overflow-hidden bg-white/80 dark:bg-[rgba(139,92,246,0.10)] backdrop-blur theme-transition"
            >
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    User ID
                  </th>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    Name
                  </th>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    Email
                  </th>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    Registered At
                  </th>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    Total Quiz Attempted
                  </th>
                  <th className="px-4 py-2 border-b-2 border-[var(--accent-color)] text-[var(--accent-color)] bg-transparent font-bold">
                    Percentage (%)
                  </th>
                  {/* Actions column removed */}
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-4 text-[var(--text-primary)] bg-transparent"
                    >
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[rgba(var(--accent-rgb,0,132,255),0.08)] transition"
                    >
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {r.id}
                      </td>
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {r.username}
                      </td>
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {r.email}
                      </td>
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {new Date(r.registeredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {r.totalQuizzes}
                      </td>
                      <td className="border-b-2 border-[var(--accent-color)] px-2 py-1 text-[var(--text-primary)] bg-transparent">
                        {r.totalQuizzes > 0
                          ? (
                              (r.totalCorrect / (r.totalQuizzes * 3)) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                      </td>
                      {/* Actions cell removed */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminReports;
