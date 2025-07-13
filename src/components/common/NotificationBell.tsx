import React from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onClick,
}) => (
  <button
    className="relative focus:outline-none"
    aria-label="Notifications"
    onClick={onClick}
  >
    <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
        {count}
      </span>
    )}
  </button>
);

export default NotificationBell;
