import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface OTPVerificationProps {
  email: string;
  onSuccess: (data: any) => void;
  onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onSuccess, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpString,
      });

      if (response.data.success) {
        console.log('OTP verification successful:', response.data.data);
        toast.success('Login successful!');
        onSuccess(response.data.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed';
      
      // Show specific error messages
      if (errorMessage.includes('Invalid OTP')) {
        toast.error('❌ Invalid OTP. Please check and try again.');
      } else if (errorMessage.includes('expired')) {
        toast.error('⏰ OTP has expired. Please request a new one.');
      } else if (errorMessage.includes('Too many')) {
        toast.error('🚫 Too many failed attempts. Please request a new OTP.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-otp', { email });
      
      if (response.data.success) {
        toast.success('New OTP sent to your email');
        setTimeLeft(300);
        setCanResend(false);
        setOtp(['', '', '', '']);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 theme-transition"
      style={{
        background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div 
          className="rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700"
          style={{
            background: "linear-gradient(135deg, var(--bg-primary) 60%, var(--bg-secondary) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 1.5px 4px 0 rgba(0,0,0,0.07)",
          }}
        >
          <div className="text-center">
            <div 
              className="mx-auto h-12 w-12 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent-color) 60%, var(--accent-hover) 100%)",
                boxShadow: "0 4px 24px 0 rgba(139,92,246,0.25)",
              }}
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 
              className="mt-6 text-3xl font-extrabold theme-transition"
              style={{ color: "var(--accent-color)" }}
            >
              Verify Your Email
            </h2>
            <p 
              className="mt-2 text-sm theme-transition"
              style={{ color: "var(--text-secondary)" }}
            >
              We've sent a 4-digit code to
            </p>
            <p 
              className="font-medium theme-transition"
              style={{ color: "var(--accent-hover)" }}
            >
              {email}
            </p>
          </div>

          <div className="mt-8">
            <div className="flex justify-center space-x-4 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 outline-none transition-all theme-transition"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent-color)";
                    e.target.style.boxShadow = "0 0 0 2px rgba(139, 92, 246, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                  }}
                  disabled={loading}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {timeLeft > 0 ? (
                <p className="text-sm theme-transition" style={{ color: "var(--text-secondary)" }}>
                  Code expires in <span className="font-medium" style={{ color: "var(--accent-color)" }}>{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--accent-color)" }}>Code has expired</p>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 4}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--accent-color) 60%, var(--accent-hover) 100%)",
                boxShadow: "0 4px 24px 0 rgba(139,92,246,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!loading && otp.join('').length === 4) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 32px 0 rgba(139,92,246,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 24px 0 rgba(139,92,246,0.25)";
              }}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Login'
              )}
            </button>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={onBack}
                className="text-sm hover:underline transition-colors theme-transition"
                style={{ color: "var(--text-secondary)" }}
                disabled={loading}
                onMouseEnter={(e) => e.target.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
              >
                ← Back to login
              </button>

              <button
                onClick={handleResendOtp}
                disabled={loading || !canResend}
                className="text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors theme-transition"
                style={{ color: canResend ? "var(--accent-color)" : "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  if (canResend && !loading) {
                    e.target.style.color = "var(--accent-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canResend) {
                    e.target.style.color = "var(--accent-color)";
                  }
                }}
              >
                {canResend ? 'Resend OTP' : 'Resend available after expiry'}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs theme-transition" style={{ color: "var(--text-secondary)" }}>
            🔒 Secure login with email verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;