import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserX, RotateCcw, Clock, Trash2 } from 'lucide-react';

interface DeactivatedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  deactivated_at: string;
  delete_at: string;
}

const DeactivatedUsers: React.FC = () => {
  const [users, setUsers] = useState<DeactivatedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeactivatedUsers();
  }, []);

  const fetchDeactivatedUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admin/deactivated-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      } else {
        toast.error('Failed to fetch deactivated users');
      }
    } catch (error) {
      toast.error('Error fetching deactivated users');
    } finally {
      setLoading(false);
    }
  };

  const reactivateUser = async (userId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admin/reactivate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User reactivated successfully');
        fetchDeactivatedUsers(); // Refresh list
      } else {
        toast.error(data.message || 'Failed to reactivate user');
      }
    } catch (error) {
      toast.error('Error reactivating user');
    }
  };

  const getDaysUntilDeletion = (deleteAt: string) => {
    const deleteDate = new Date(deleteAt);
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserX className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Deactivated Users ({users.length})
        </h2>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <UserX className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No deactivated users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Deactivated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Deletion Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => {
                const daysUntilDeletion = getDaysUntilDeletion(user.delete_at);
                const isExpired = daysUntilDeletion <= 0;
                
                return (
                  <tr key={user.id} className={isExpired ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.deactivated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <Trash2 className="w-3 h-3" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-3 h-3" />
                          {daysUntilDeletion} days left
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!isExpired && (
                        <button
                          onClick={() => reactivateUser(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeactivatedUsers;