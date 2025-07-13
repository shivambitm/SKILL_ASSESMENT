import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ThemeSwitcher from "../common/ThemeSwitcher";
// Exam/CBT mode info bar (single definition, before Header)
function CBTExamInfo({ hideIp }: { hideIp?: boolean }) {
  const [dateTime, setDateTime] = useState("");
  const [ip, setIp] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      // Format: 08:02:30 PM - July 10, 2025
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const date = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setDateTime(`${time} - ${date}`);
    };
    update();
    const interval = setInterval(update, 1000);
    if (!hideIp) {
      fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => setIp(data.ip));
    }
    return () => clearInterval(interval);
  }, [hideIp]);
  return (
    <div className="flex items-center space-x-4 text-base font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-gray-800 px-4 py-2 rounded shadow">
      <span>{dateTime}</span>
      {!hideIp && ip && <span className="ml-2">| Tracked IP: {ip}</span>}
    </div>
  );
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  // Determine dashboard route based on role
  const dashboardRoute =
    user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={dashboardRoute} className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-color)" }}
              >
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Skill Assessment & Reporting Portal
              </span>
            </Link>
          </div>

          {/* Exam/CBT mode: Show current date/time and IP (not for admin) */}
          <nav className="hidden md:flex space-x-8 items-center">
            <CBTExamInfo hideIp={user?.role === "admin"} />
          </nav>

          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* User dropdown only, bell icon removed for all users */}
            <div className="relative group">
              <button
                className="flex items-center space-x-2 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
