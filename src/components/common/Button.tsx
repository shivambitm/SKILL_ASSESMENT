import React, { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  useTheme(); // Ensure theme context is used

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 theme-transition";

  const getVariantStyle = (variant: string) => {
    const styles: React.CSSProperties = {
      transition: "all 0.3s ease",
      fontWeight: 500,
    };

    switch (variant) {
      case "primary":
        styles.backgroundColor = "var(--accent-color)";
        styles.color = "#ffffff";
        styles.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        break;
      case "secondary":
        styles.backgroundColor = "var(--bg-secondary)";
        styles.color = "var(--text-primary)";
        styles.borderColor = "var(--border-color)";
        styles.borderWidth = "1px";
        styles.borderStyle = "solid";
        break;
      case "danger":
        styles.backgroundColor = "#ef4444";
        styles.color = "#ffffff";
        break;
      case "ghost":
        styles.backgroundColor = "transparent";
        styles.color = "var(--text-secondary)";
        break;
    }

    return styles;
  };

  const getHoverStyles = (variant: string): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return { backgroundColor: "var(--accent-hover)" };
      case "secondary":
        return { backgroundColor: "var(--border-color)" };
      case "danger":
        return { backgroundColor: "#b91c1c" };
      case "ghost":
        return { backgroundColor: "var(--bg-secondary)" };
      default:
        return {};
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isDisabled = disabled || loading;
  const buttonStyle = getVariantStyle(variant);

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      disabled={isDisabled}
      style={buttonStyle}
      onMouseOver={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, getHoverStyles(variant));
        }
      }}
      onMouseOut={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, buttonStyle);
        }
      }}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
