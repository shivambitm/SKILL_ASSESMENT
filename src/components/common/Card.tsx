import React, { ReactNode } from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  style = {},
  onClick,
}) => {
  useTheme(); // Ensure theme context is used

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const defaultStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    borderColor: "var(--border-color)",
    borderWidth: "1px",
    borderStyle: "solid",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div
      className={`rounded-lg shadow-md theme-transition card ${
        paddingClasses[padding]
      } ${className} ${
        onClick ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      }`}
      style={{ ...defaultStyle, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
