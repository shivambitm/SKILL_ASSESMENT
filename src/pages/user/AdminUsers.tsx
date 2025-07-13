import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { adminApi } from "../../services/api";

interface User {
  id: number;
  username: string;
  email: string;
  registeredAt: string;
  totalQuizzes: number;
  totalCorrect: number;
  avgScore: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.debug("[AdminUsers] useEffect: fetching all user reports");
    adminApi
      .getAllUserReports()
      .then((res) => {
        console.debug("[AdminUsers] API response:", res);
        setUsers(res.data.reports || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[AdminUsers] API error:", err);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">All Users</h2>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">User ID</th>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Registered At</th>
                <th className="px-4 py-2 border">Total Quizzes</th>
                <th className="px-4 py-2 border">Total Correct</th>
                <th className="px-4 py-2 border">Avg. Score (%)</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="border px-2 py-1">{u.id}</td>
                    <td className="border px-2 py-1">{u.username}</td>
                    <td className="border px-2 py-1">{u.email}</td>
                    <td className="border px-2 py-1">
                      {new Date(u.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="border px-2 py-1">{u.totalQuizzes}</td>
                    <td className="border px-2 py-1">{u.totalCorrect}</td>
                    <td className="border px-2 py-1">
                      {u.avgScore.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default AdminUsers;
