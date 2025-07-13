import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authApi, usersApi, reportsApi } from "../../services/api";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import SuccessMessage from "../../components/common/SuccessMessage";
import { User, Mail, Shield, Edit, Save, X } from "lucide-react";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
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

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Password changed successfully!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
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
                  {userReport?.statistics?.avgScore != null
                    ? `${userReport.statistics.avgScore}%`
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
                  {userReport?.skillPerformance?.length ?? 0}
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
