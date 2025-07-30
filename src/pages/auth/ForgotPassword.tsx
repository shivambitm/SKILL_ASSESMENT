import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Shield, Key } from "lucide-react";
import { authApi } from "../../services/api";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import PasswordInput from "../../components/common/PasswordInput";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setTheme } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();

  // Force premium theme
  React.useEffect(() => {
    setTheme("premium");
  }, [setTheme]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      showSuccess("OTP sent to your email address!");
      setSuccess("OTP sent to your email address!");
      setStep("otp");

      // Show OTP in development mode
      if (response.data.data?.otp) {
        showInfo(`Demo OTP: ${response.data.data.otp}`, "Development Mode");
        setSuccess(`OTP sent! For demo: ${response.data.data.otp}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // console.log('🔍 Frontend: Verifying OTP...', { email, otp });
      const response = await authApi.verifyOtp({ email, otp });
      // console.log('✅ Frontend: OTP response received:', response.data);
      setResetToken(response.data.data.resetToken);
      showSuccess("OTP verified! Please set your new password.");
      setSuccess("OTP verified! Please set your new password.");
      setStep("reset");
    } catch (err: any) {
      console.error("❌ Frontend: OTP verification failed:", err);
      console.error("❌ Frontend: Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || "Invalid OTP";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    if (newPassword.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      showError(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });
      showSuccess("Password reset successfully! Redirecting to login...");
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to reset password";
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-color) 60%, var(--accent-hover) 100%)",
            boxShadow: "0 4px 24px 0 rgba(139,92,246,0.25)",
          }}
        >
          <Mail className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
        <h2
          className="text-2xl font-bold mb-2 theme-transition drop-shadow-lg"
          style={{ color: "var(--accent-color)" }}
        >
          Forgot Password?
        </h2>
        <p
          className="theme-transition"
          style={{ color: "var(--text-secondary)" }}
        >
          Enter your email address and we'll send you an OTP to reset your
          password.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-base font-bold mb-2"
          style={{ color: "var(--accent-color)" }}
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-lg theme-transition shadow"
          placeholder="Enter your email address"
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Send OTP
      </Button>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
            boxShadow: "0 4px 24px 0 rgba(34, 197, 94, 0.25)",
          }}
        >
          <Shield className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
        <h2
          className="text-2xl font-bold mb-2 theme-transition drop-shadow-lg"
          style={{ color: "var(--accent-color)" }}
        >
          Verify OTP
        </h2>
        <p
          className="theme-transition"
          style={{ color: "var(--text-secondary)" }}
        >
          Enter the 6-digit OTP sent to{" "}
          <strong style={{ color: "var(--accent-color)" }}>{email}</strong>
        </p>
      </div>

      <div>
        <label
          htmlFor="otp"
          className="block text-base font-bold mb-2"
          style={{ color: "var(--accent-color)" }}
        >
          6-Digit OTP
        </label>
        <input
          id="otp"
          type="text"
          required
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-center text-2xl tracking-widest theme-transition shadow"
          placeholder="000000"
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setStep("email")}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Verify OTP
        </Button>
      </div>
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(109, 40, 217, 0.9))",
            boxShadow: "0 4px 24px 0 rgba(124, 58, 237, 0.25)",
          }}
        >
          <Key className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
        <h2
          className="text-2xl font-bold mb-2 theme-transition drop-shadow-lg"
          style={{ color: "var(--accent-color)" }}
        >
          Reset Password
        </h2>
        <p
          className="theme-transition"
          style={{ color: "var(--text-secondary)" }}
        >
          Create a new password for your account
        </p>
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-base font-bold mb-2"
          style={{ color: "var(--accent-color)" }}
        >
          New Password
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
          className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-lg theme-transition shadow"
          showCopyButton={false}
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-base font-bold mb-2"
          style={{ color: "var(--accent-color)" }}
        >
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          className="appearance-none block w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-lg theme-transition shadow"
          showCopyButton={false}
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Reset Password
      </Button>
    </form>
  );

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
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium hover:underline theme-transition"
            style={{ color: "var(--accent-color)" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {error && <ErrorMessage message={error} className="mb-4" />}
        {success && (
          <div
            className="mb-4 p-4 rounded-xl border shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))",
              borderColor: "rgba(34, 197, 94, 0.3)",
              color: "var(--text-primary)",
            }}
          >
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {step === "email" && renderEmailStep()}
        {step === "otp" && renderOtpStep()}
        {step === "reset" && renderResetStep()}
      </div>
    </div>
  );
};

export default ForgotPassword;
