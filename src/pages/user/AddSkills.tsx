import React from "react";
import Card from "../../components/common/Card";

const AddSkills: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Add & Manage Skills</h2>
      <p className="mb-2 text-gray-600">
        Here you can add, edit, or delete skills. (UI/CRUD coming soon)
      </p>
      {/* TODO: Implement full CRUD for skills */}
      <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center text-gray-400">
        No skills yet. Start by adding a new skill.
      </div>
    </Card>
  );
};

export default AddSkills;
