import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import DeactivatedUsers from "../../components/admin/DeactivatedUsers";
import { useToast } from "../../contexts/ToastContext";
import { adminApi } from "../../services/api";
import { Users, UserX } from "lucide-react";

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
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active');

  useEffect(() => {
    console.debug("[AdminUsers] useEffect: fetching all user reports");
    adminApi
      .getAllUserReports()
      .then((res) => {
        console.debug("[AdminUsers] API response:", res);
        const userReports = res.data.reports || [];
        setUsers(userReports);
        showSuccess(`Loaded ${userReports.length} user reports successfully!`);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[AdminUsers] API error:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load user reports";
        showError(errorMsg);
        setError(errorMsg);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Active Users
        </button>
        <button
          onClick={() => setActiveTab('deactivated')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'deactivated'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <UserX className="w-4 h-4" />
          Deactivated Users
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'active' ? (
        <Card>
          <h2 className="text-2xl font-bold mb-4">Active Users</h2>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Serial No.</th>
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
                  <td colSpan={8} className="text-center py-4">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={u.id}>
                    <td className="border px-2 py-1">{idx + 1}</td>
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
      ) : (
        <DeactivatedUsers />
      )}
    </div>
  );
};

export default AdminUsers;
