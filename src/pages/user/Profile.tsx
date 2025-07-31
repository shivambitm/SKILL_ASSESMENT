import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { authApi, usersApi, reportsApi } from "../../services/api";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import SuccessMessage from "../../components/common/SuccessMessage";
import { User, Mail, Shield, Edit, Save, X, UserX, AlertTriangle } from "lucide-react";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [userReport, setUserReport] = useState<any>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await usersApi.updateProfile(formData);
      const updatedUser = response.data.data.user;

      // Update the user context with the new data
      updateUser(updatedUser);

      showSuccess("Profile updated successfully!");
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update profile";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMsg = "New passwords do not match";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess("Password changed successfully!");
      setSuccess("Password changed successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to change password";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
    setError("");
  };

  React.useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const response = await reportsApi.getUserReport(user.id);
        setUserReport(response.data.data);
      } catch (err) {
        // ignore for now
      }
    };
    fetchStats();
  }, [user]);

  const handleDeactivateAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showSuccess('Account deactivated. You have 30 days to reactivate.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else {
        showError(data.message || 'Failed to deactivate account');
      }
    } catch (error) {
      showError('Failed to deactivate account');
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        <ErrorMessage message="User not found. Please log in again." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Profile
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && <SuccessMessage message={success} />}
      {error && <ErrorMessage message={error} />}

      {/* Profile Information Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Personal Information
            </h2>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleProfileUpdate}
                  loading={loading}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4 md:col-span-2">
              <div
                className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-color)", color: "white" }}
              >
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3
                  className="text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.firstName} {user.lastName}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.email}
                </p>
                <p
                  className="text-sm capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Shield className="w-4 h-4 inline mr-1" />
                  {user.role}
                </p>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p
                  className="py-2 profile-field"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p
                  className="py-2 profile-field"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.lastName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p
                  className="py-2 profile-field"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.email}
                </p>
              )}
            </div>

            {/* User ID */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                User ID
              </label>
              <p className="py-2" style={{ color: "var(--text-primary)" }}>
                #{user.id}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Security
            </h2>
            {!showPasswordChange && (
              <Button
                onClick={() => setShowPasswordChange(true)}
                variant="secondary"
                size="sm"
              >
                Change Password
              </Button>
            )}
          </div>

          {showPasswordChange && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Current Password
                </label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="rounded-md"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="rounded-md"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="rounded-md"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePasswordUpdate}
                  loading={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Password
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setError("");
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!showPasswordChange && (
            <p style={{ color: "var(--text-secondary)" }}>
              Keep your account secure by using a strong password and changing
              it regularly.
            </p>
          )}
        </div>
      </Card>

      {/* Account Deactivation Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Danger Zone
          </h2>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">
                  Deactivate Account
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                  Deactivating your account will:
                </p>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 mb-4">
                  <li>• Block access to your account immediately</li>
                  <li>• Hide your quiz results and profile</li>
                  <li>• Give you 30 days to reactivate before permanent deletion</li>
                  <li>• Allow reactivation with email and password</li>
                </ul>
              </div>
              <Button
                onClick={() => setShowDeactivateModal(true)}
                variant="secondary"
                className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate Account
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Account Deactivation
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to deactivate your account? This action will:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
              <li>• Block immediate access to your account</li>
              <li>• Start a 30-day countdown for permanent deletion</li>
              <li>• Allow reactivation within 30 days</li>
            </ul>
            <div className="flex gap-3">
              <Button
                onClick={handleDeactivateAccount}
                loading={loading}
                className="bg-red-500 hover:bg-red-600 text-white flex-1"
              >
                Yes, Deactivate Account
              </Button>
              <Button
                onClick={() => setShowDeactivateModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Statistics (Optional) */}
      {user.role !== "admin" && (
        <Card>
          <div className="p-6">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Account Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--accent-color)" }}
                >
                  {userReport?.statistics?.totalQuizzes ?? 0}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Quizzes Taken
                </div>
              </div>
              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--accent-color)" }}
                >
                  {userReport?.statistics?.averageScore != null
                    ? `${userReport.statistics.averageScore}%`
                    : "0%"}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Average Score
                </div>
              </div>
              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--accent-color)" }}
                >
                  {userReport?.recentQuizzes ? 
                    [...new Set(userReport.recentQuizzes.map((q: any) => q.skillName))].length 
                    : 0}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Skills Assessed
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Profile;
