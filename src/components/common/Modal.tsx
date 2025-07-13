import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  style?: React.CSSProperties;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  style = {},
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          className={`relative z-50 w-full rounded-3xl p-8 shadow-[0_8px_40px_0_rgba(139,92,246,0.25)] border-2 border-[var(--accent-color)] bg-gradient-to-br from-[rgba(139,92,246,0.25)] via-[rgba(15,15,35,0.85)] to-[rgba(75,0,130,0.7)] backdrop-blur-2xl theme-transition ${sizeClasses[size]}`}
          style={{
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            color: "var(--text-primary)",
            boxShadow: "0 8px 40px 0 rgba(139,92,246,0.25)",
            border: "2px solid var(--accent-color, #8b5cf6)",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(15,15,35,0.85) 60%, rgba(75,0,130,0.7) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            ...style,
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-extrabold tracking-wide text-[var(--accent-color)] drop-shadow-lg font-sans">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--accent-color)] hover:text-white focus:outline-none focus:text-white !p-1 bg-[rgba(139,92,246,0.15)] rounded-full border border-[var(--accent-color)] shadow transition"
              aria-label="Close modal"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
