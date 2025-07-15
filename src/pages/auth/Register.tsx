import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import PasswordInput from "../../components/common/PasswordInput";
import { useTheme } from "../../contexts/ThemeContext";
import { BookOpen } from "lucide-react";
import { toast, ToastContainer } from "react-toastify"; // ✅ NEW
import "react-toastify/dist/ReactToastify.css"; // ✅ NEW
import "./Register.css";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    adminPasscode: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    setTheme("premium");
  }, [setTheme]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAdmin(e.target.checked);
    setFormData((prev) => ({
      ...prev,
      role: e.target.checked ? "admin" : "user",
      adminPasscode: "",
    }));
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.role === "admin" && formData.adminPasscode !== "admin") {
      setError("Invalid admin passcode");
      return;
    }

    setLoading(true);
    toast.info("You are being registered...", { autoClose: 2000 }); // ✅ Toast

    try {
      await delay(1000); // optional delay
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.role as "admin" | "user",
        formData.role === "admin" ? formData.adminPasscode : undefined
      );
      navigate(formData.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err: unknown) {
      await delay(1000);
      const error = err as { message?: string };
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 theme-transition bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] dark:from-gray-900 dark:to-gray-800">
      {/* Toast Container */}
      <ToastContainer position="top-right" theme="colored" />{" "}
      {/* ✅ Toast Container */}
      <header className="w-screen left-0 top-0 flex justify-center items-center py-4 bg-white/80 dark:bg-gray-900/80 shadow-2xl border-b border-gray-200 dark:border-gray-700 mb-8 backdrop-blur-md fixed z-30">
        <span className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg w-full text-center px-4">
          Skill Assessment & Reporting Portal
        </span>
      </header>
      <div className="spacer" />
      <div className="max-w-md w-full space-y-8 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
              <BookOpen className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <h2 className="mt-2 text-center text-4xl font-black theme-transition drop-shadow-lg">
            Create your account
          </h2>
          <p className="mt-2 text-center text-lg theme-transition">
            Or{" "}
            <Link
              to="/login"
              className="font-bold hover:underline theme-transition"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-2xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-2">
              <input
                id="isAdmin"
                name="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={handleAdminToggle}
                className="mr-2"
              />
              <label
                htmlFor="isAdmin"
                className="text-sm font-medium text-gray-700"
              >
                Register as Admin
              </label>
            </div>

            {isAdmin && (
              <div>
                <label
                  htmlFor="adminPasscode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Passcode
                </label>
                <input
                  id="adminPasscode"
                  name="adminPasscode"
                  type="password"
                  value={formData.adminPasscode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter admin passcode"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                autoComplete="new-password"
                required
                className="mt-1 rounded-md"
                showCopyButton={false}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                autoComplete="new-password"
                required
                className="mt-1 rounded-md"
                showCopyButton={false}
              />
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div>
            <Button
              type="submit"
              loading={loading} // ✅ Spinner enabled
              className="group relative w-full flex justify-center py-2 px-4"
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
