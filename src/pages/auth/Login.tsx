import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useGoogleAuth } from "../../contexts/GoogleAuthContext";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import Modal from "../../components/common/Modal";
import PasswordInput from "../../components/common/PasswordInput";
import ThemeSwitcher from "../../components/common/ThemeSwitcher";
import AdminPasscodeModal from "../../components/AdminPasscodeModal";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { BookOpen } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useAuth();
  const { signIn } = useGoogleAuth();
  const { setTheme } = useTheme();
  const { showSuccess, showError } = useToast();
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

    // console.log("🔐 Starting login process...");
    // console.log("📧 Email:", email);
    // console.log("🔒 Password length:", password.length);

    try {
      // console.log("🚀 Calling login function...");
      await login(email, password);
      // After login, get the user from localStorage (since login sets it)
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      showSuccess(`Welcome back, ${userData?.firstName || 'User'}!`);
      if (userData && userData.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      console.error("❌ Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || "Login failed";
      showError(errorMsg);
      setError(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signIn();
    } catch (error: any) {
      if (error.requiresAdminPasscode) {
        setPendingUserInfo(error.userInfo);
        setShowAdminModal(true);
      } else {
        showError('Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
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
                className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-lg theme-transition bg-white/80 dark:bg-gray-800/80 text-blue-900 dark:text-blue-100 border-gray-200 dark:border-gray-700 shadow"
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

          {/* Google Sign-in Button - Beautiful Morphism Glass */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="
                relative overflow-hidden group w-full
                bg-gradient-to-br from-white/20 via-white/10 to-transparent
                dark:from-gray-800/30 dark:via-gray-700/20 dark:to-transparent
                backdrop-blur-xl
                border border-white/30 dark:border-gray-600/30
                shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)]
                px-8 py-4
                rounded-2xl
                font-bold text-lg
                transition-all duration-500 ease-out
                hover:scale-[1.02]
                hover:bg-gradient-to-br hover:from-blue-500/20 hover:via-purple-500/15 hover:to-pink-500/10
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                before:absolute before:inset-0 before:rounded-2xl
                before:bg-gradient-to-br before:from-white/10 before:to-transparent
                before:opacity-0 hover:before:opacity-100
                before:transition-opacity before:duration-500
              "
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-pulse"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
              
              <div className="relative flex items-center justify-center gap-4 text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors duration-300">
                {googleLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-extrabold tracking-wide">Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-extrabold tracking-wide text-xl">Sign in with Google</span>
                  </>
                )}
              </div>
              
              {/* Bottom glow effect */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-pink-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-colors duration-200 hover:underline"
            >
              Forgot your password?
            </Link>
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
      
      {/* Footer with Policy Links */}
      <div className="mt-12 text-center">
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
          <Link 
            to="/privacy" 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            Privacy
          </Link>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <Link 
            to="/terms" 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            Terms
          </Link>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <Link 
            to="/cancellation" 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            Cancellation
          </Link>
          <br className="sm:hidden" />
          <Link 
            to="/delivery" 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            Delivery
          </Link>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <Link 
            to="/policy" 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            Policy
          </Link>
        </div>
      </div>
      
      {/* Admin Passcode Modal */}
      <AdminPasscodeModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setPendingUserInfo(null);
        }}
        onSubmit={async (passcode) => {
          try {
            setGoogleLoading(true);
            await signIn(passcode);
            setShowAdminModal(false);
            setPendingUserInfo(null);
          } catch (error) {
            console.error('Admin verification failed:', error);
            showError('Admin verification failed');
          } finally {
            setGoogleLoading(false);
          }
        }}
        userInfo={pendingUserInfo}
        isLoading={googleLoading}
      />
    </div>
  );
};

export default Login;
