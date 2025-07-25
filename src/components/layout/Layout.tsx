import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./Layout.module.css";

const Layout: React.FC = () => {
  useTheme();

  return (
    <div className={styles.layoutRoot}>
      <Header />
      <div className={styles.contentWrapper}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
