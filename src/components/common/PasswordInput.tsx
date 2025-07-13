import React, { useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  showCopyButton?: boolean;
  style?: React.CSSProperties;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
  required = false,
  className = "",
  showCopyButton = false,
  style = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const baseInputClassName = `
    appearance-none relative block w-full px-3 py-2 pr-20 border border-gray-300 
    placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 
    focus:border-blue-500 focus:z-10 sm:text-sm
  `;

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        className={`${baseInputClassName} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={style}
      />

      <div className="absolute inset-y-0 right-0 flex items-center">
        {showCopyButton && value && (
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
            title={copied ? "Copied!" : "Copy password"}
          >
            <Copy className={`h-4 w-4 ${copied ? "text-green-500" : ""}`} />
          </button>
        )}

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
