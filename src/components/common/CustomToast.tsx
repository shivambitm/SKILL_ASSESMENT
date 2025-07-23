import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface CustomToastProps {
  type: ToastType;
  message: string;
}

const iconMap = {
  success: <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />,
  error: <AlertCircle className="w-6 h-6 text-red-500 mr-2" />,
  info: <Info className="w-6 h-6 text-blue-500 mr-2" />,
};

const bgMap = {
  success: "bg-gradient-to-r from-green-100 to-green-50 border-green-400",
  error: "bg-gradient-to-r from-red-100 to-red-50 border-red-400",
  info: "bg-gradient-to-r from-blue-100 to-blue-50 border-blue-400",
};

const textMap = {
  success: "text-green-800",
  error: "text-red-800",
  info: "text-blue-800",
};

const CustomToast: React.FC<CustomToastProps> = ({ type, message }) => (
  <div
    className={`flex items-center px-4 py-3 rounded-xl shadow-lg border-l-8 ${bgMap[type]} ${textMap[type]} animate-fade-in`}
    style={{ minWidth: 260, maxWidth: 400 }}
  >
    {iconMap[type]}
    <span className="font-semibold text-base break-words">{message}</span>
  </div>
);

export default CustomToast;
