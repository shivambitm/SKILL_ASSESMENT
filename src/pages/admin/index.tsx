import React from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import AdminSkills from "./AdminSkills";
import AdminQuestions from "./AdminQuestions";

const AdminIndex: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">Admin Portal</h1>
      <nav className="mb-8 flex space-x-4">
        <NavLink
          to="."
          end
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="skills"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Skills
        </NavLink>
        <NavLink
          to="questions"
          className={({ isActive }) => (isActive ? "font-bold underline" : "")}
        >
          Questions
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="skills" element={<AdminSkills />} />
        <Route path="questions" element={<AdminQuestions />} />
      </Routes>
    </div>
  );
};

export default AdminIndex;
