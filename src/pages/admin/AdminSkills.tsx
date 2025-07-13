import React from "react";
import Card from "../../components/common/Card";
import SkillWithQuestionsForm from "./SkillWithQuestionsForm";

// Removed unused Skill interface for lint clean-up.

const AdminSkills: React.FC = () => {
  // Removed unused state variables for lint clean-up.

  // Removed unused effect, fetchSkills, and handleDelete for lint clean-up.

  // Theme-aware background for premium
  const theme = localStorage.getItem("theme") || "light";
  let bgClass = "bg-[var(--bg-primary)]";
  if (theme === "premium") {
    bgClass = "bg-gradient-to-br from-[#1a1333] via-[#2d225a] to-[#3b1f5e]";
  }
  return (
    <div
      className={`min-h-[600px] flex flex-col items-center justify-center p-0 m-0 overflow-hidden ${bgClass}`}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center text-[var(--text-primary)] drop-shadow-lg">
          Manage Skills
        </h1>
        <div
          className="w-full h-full flex flex-col items-center justify-center overflow-y-auto smooth-scrollbar"
          style={{ maxHeight: "80vh" }}
        >
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
            <Card className="flex-1 p-8 shadow-2xl rounded-2xl border-2 border-[var(--accent-color)] bg-white/90 dark:bg-[var(--bg-secondary)] backdrop-blur-xl">
              <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
                Add Skill with Questions
              </h2>
              <div className="w-full max-w-3xl mx-auto">
                <SkillWithQuestionsForm />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSkills;
