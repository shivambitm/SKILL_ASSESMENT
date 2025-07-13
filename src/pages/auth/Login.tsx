import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import Modal from "../../components/common/Modal";
import PasswordInput from "../../components/common/PasswordInput";
import ThemeSwitcher from "../../components/common/ThemeSwitcher";
import { useTheme } from "../../contexts/ThemeContext";
import { BookOpen } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { setTheme } = useTheme();
  // Force premium theme on login page
  useEffect(() => {
    setTheme("premium");
  }, [setTheme]);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine redirect path after login
  const { user } = useAuth();
  let from = "/dashboard";
  if (user && user.role === "admin") {
    from = "/admin/dashboard";
  } else if (location.state?.from?.pathname) {
    from = location.state.from.pathname;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔐 Starting login process...");
    console.log("📧 Email:", email);
    console.log("🔒 Password length:", password.length);

    try {
      console.log("🚀 Calling login function...");
      await login(email, password);
      // After login, get the user from localStorage (since login sets it)
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      if (userData && userData.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      console.error("❌ Error response:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 theme-transition bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] dark:from-gray-900 dark:to-gray-800"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      }}
    >
      {/* Header Bar */}
      <header
        className="w-screen left-0 top-0 flex justify-center items-center py-4 bg-white/80 dark:bg-gray-900/80 shadow-2xl border-b border-gray-200 dark:border-gray-700 mb-8 backdrop-blur-md fixed z-30"
        style={{ minWidth: "100vw" }}
      >
        <span
          className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg w-full text-center px-4"
          style={{ color: "var(--text-primary)" }}
        >
          Skill Assessment & Reporting Portal
        </span>
      </header>
      <div style={{ height: "80px" }} /> {/* Spacer for fixed header */}
      <div
        className="max-w-md w-full space-y-8 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-primary) 60%, var(--bg-secondary) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 1.5px 4px 0 rgba(0,0,0,0.07)",
        }}
      >
        <div>
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-color) 60%, var(--accent-hover) 100%)",
                boxShadow: "0 4px 24px 0 rgba(139,92,246,0.25)",
              }}
            >
              <BookOpen className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <h2
            className="mt-2 text-center text-4xl font-black theme-transition drop-shadow-lg"
            style={{ color: "var(--accent-color)" }}
          >
            Sign in to your account
          </h2>
          <p
            className="mt-2 text-center text-lg theme-transition"
            style={{ color: "var(--text-secondary)" }}
          >
            Or{" "}
            <Link
              to="/register"
              className="font-bold hover:underline theme-transition"
              style={{ color: "var(--accent-hover)" }}
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div
            className="rounded-2xl shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-800"
            style={{
              background:
                "linear-gradient(120deg, var(--bg-secondary) 80%, var(--bg-primary) 100%)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-base font-bold mb-2"
                style={{ color: "var(--accent-color)" }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-lg theme-transition bg-white/80 dark:bg-gray-800/80 text-blue-900 dark:text-blue-100 border-gray-200 dark:border-gray-700 shadow"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-base font-bold mb-2"
                style={{ color: "var(--accent-color)" }}
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className="rounded-xl"
                showCopyButton={true}
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              />
            </div>
          </div>

          {/* Show error as modal instead of inline error */}
          <Modal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="Login Error"
            size="sm"
          >
            <div className="text-center text-red-600 font-semibold mb-2">
              {error}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setShowErrorModal(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </Modal>

          <div>
            <Button
              type="submit"
              loading={loading}
              className="group relative w-full flex justify-center py-3 px-4 rounded-2xl text-xl font-black bg-gradient-to-r from-[var(--accent-color)] via-[var(--accent-hover)] to-[var(--accent-color)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-color)] text-white shadow-xl transition-all duration-200 tracking-wide"
            >
              Sign in
            </Button>
          </div>

          <div className="text-center mt-6">
            <div
              className="text-lg font-bold rounded-2xl p-4 border shadow-lg"
              style={{
                background:
                  "linear-gradient(90deg, var(--bg-secondary) 60%, var(--bg-primary) 100%)",
                color: "var(--accent-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <span className="font-extrabold">Demo Credentials:</span>
              <br />
              <span className="bg-[var(--accent-color)]/10 px-3 py-1 rounded-xl font-mono text-[var(--accent-color)] text-base font-bold">
                Admin: admin@example.com / admin123
              </span>
              <br />
              <span className="bg-[var(--accent-color)]/10 px-3 py-1 rounded-xl font-mono text-[var(--accent-color)] text-base font-bold">
                User: user@example.com / user123
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
