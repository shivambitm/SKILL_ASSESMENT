import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
      <CheckCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};

export default SuccessMessage;