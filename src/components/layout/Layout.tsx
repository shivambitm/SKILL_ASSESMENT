import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";

const Layout: React.FC = () => {
  useTheme(); // Ensure theme context is used

  // Height of the fixed header (h-16 = 4rem = 64px)
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <Header />
      <div className="flex min-h-screen" style={{ paddingTop: "4rem" }}>
        <Sidebar />
        <main
          className="flex-1 p-6 theme-transition"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            minHeight: "100vh",
            marginTop: "-4rem", // counteract the extra space for Sidebar/main
            paddingTop: "4rem", // ensure content is not hidden under header
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
