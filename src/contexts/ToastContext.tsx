import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/common/Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (
    type: ToastType,
    message: string,
    title?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      id,
      type,
      message,
      title,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const showSuccess = (message: string, title?: string) => {
    showToast('success', message, title);
  };

  const showError = (message: string, title?: string) => {
    showToast('error', message, title);
  };

  const showWarning = (message: string, title?: string) => {
    showToast('warning', message, title);
  };

  const showInfo = (message: string, title?: string) => {
    showToast('info', message, title);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};