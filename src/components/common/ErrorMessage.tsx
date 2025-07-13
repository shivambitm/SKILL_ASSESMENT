import React from "react";
import { AlertCircle, Clock } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  isRateLimitError?: boolean;
  retryAfter?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
  isRateLimitError = false,
  retryAfter,
}) => {
  // Show countdown for rate limit errors
  if (isRateLimitError) {
    return (
      <div
        className={`flex items-center space-x-2 text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded-md ${className}`}
      >
        <Clock className="w-5 h-5" />
        <span>
          <strong>Rate limit exceeded.</strong> {message}
          {retryAfter && (
            <div className="text-sm mt-1">
              Please try again in approximately {retryAfter} seconds.
            </div>
          )}
        </span>
      </div>
    );
  }

  // Default error message
  return (
    <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
      <AlertCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;
