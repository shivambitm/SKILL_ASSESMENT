import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: CheckCircle,
          iconColor: 'text-white',
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: XCircle,
          iconColor: 'text-white',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          icon: AlertCircle,
          iconColor: 'text-white',
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: Info,
          iconColor: 'text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          icon: Info,
          iconColor: 'text-white',
        };
    }
  };

  const { bg, icon: Icon, iconColor } = getToastStyles();

  return (
    <div
      className={`${bg} text-white p-4 rounded-xl shadow-2xl backdrop-blur-md border border-white/20 transform transition-all duration-300 ease-in-out animate-slide-in-right max-w-sm w-full`}
      style={{
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-bold text-sm mb-1 text-white">{title}</h4>
          )}
          <p className="text-sm text-white/90 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;