import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  History,
  Trophy,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
  FileText,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  useTheme(); // Ensure theme context is used

  const userNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/quiz", label: "Take Quiz", icon: BookOpen },
    { path: "/history", label: "Quiz History", icon: History },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/profile", label: "Profile", icon: Settings },
  ];

  const adminNavItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/skills", label: "Add Skills", icon: Settings },
    { path: "/admin/questions", label: "Edit/Delete Skills", icon: Trash2 },
    { path: "/admin/reports", label: "Reports", icon: FileText },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems;

  const [collapsed, setCollapsed] = React.useState(false);
  // Make sidebar full height using min-h-screen and flex-grow
  return (
    <div
      className={`theme-transition flex flex-col ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen sticky top-0`}
      style={{
        backgroundColor: "var(--bg-primary)",
        borderRight: "1px solid var(--border-color)",
        transition: "width 0.2s",
        zIndex: 20,
      }}
    >
      <div className="p-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{
            color: "var(--text-primary)",
            display: collapsed ? "none" : undefined,
          }}
        >
          {user?.role === "admin" ? "Admin Panel" : "Menu"}
        </h2>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
          className="ml-2 p-1 rounded hover:bg-gray-200 focus:outline-none"
          style={{ minWidth: 32 }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            {collapsed ? (
              <path
                d="M7 5l5 5-5 5"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M13 5l-5 5 5 5"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>

      <nav className="mt-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors theme-transition ${
                    collapsed ? "justify-center" : ""
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? "var(--accent-color)"
                      : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
