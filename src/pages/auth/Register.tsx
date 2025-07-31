import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useGoogleAuth } from "../../contexts/GoogleAuthContext";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import PasswordInput from "../../components/common/PasswordInput";
import AdminPasscodeModal from "../../components/AdminPasscodeModal";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { BookOpen } from "lucide-react";
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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register } = useAuth();
  const { signIn } = useGoogleAuth();
  const { setTheme } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
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
      const errorMsg = "Passwords do not match";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.password.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.role === "admin" && formData.adminPasscode !== "admin") {
      const errorMsg = "Invalid admin passcode";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    showInfo("Creating your account...");

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
      showSuccess(`Welcome ${formData.firstName}! Your account has been created successfully.`);
      navigate(formData.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err: unknown) {
      await delay(1000);
      const error = err as { message?: string };
      const errorMsg = error.message || "Registration failed";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      await signIn();
    } catch (error: any) {
      if (error.requiresAdminPasscode) {
        setPendingUserInfo(error.userInfo);
        setShowAdminModal(true);
      } else {
        showError('Google sign-up failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 theme-transition bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] dark:from-gray-900 dark:to-gray-800">

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

          {/* Google Sign-up Button - Beautiful Morphism Glass */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
                hover:bg-gradient-to-br hover:from-green-500/20 hover:via-blue-500/15 hover:to-purple-500/10
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
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 via-blue-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-pulse"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
              
              <div className="relative flex items-center justify-center gap-4 text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors duration-300">
                {googleLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-extrabold tracking-wide">Signing up...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-extrabold tracking-wide text-xl">Sign up with Google</span>
                  </>
                )}
              </div>
              
              {/* Bottom glow effect */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-green-500/0 via-blue-500/50 to-purple-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>
        </form>
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

export default Register;
