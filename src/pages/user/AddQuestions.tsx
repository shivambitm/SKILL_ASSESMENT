import React from "react";
import Card from "../../components/common/Card";

const AddQuestions: React.FC = () => {
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Add & Manage Questions</h2>
      <p className="mb-2 text-gray-600">
        Here you can add, edit, or delete questions for any skill. (UI/CRUD
        coming soon)
      </p>
      {/* TODO: Implement full CRUD for questions, filter by skill, etc. */}
      <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center text-gray-400">
        No questions yet. Start by adding a new question.
      </div>
    </Card>
  );
};

export default AddQuestions;
