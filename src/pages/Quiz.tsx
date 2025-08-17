import React from 'react';
import { useParams } from 'react-router-dom';

const Quiz: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Quiz for Skill ID: {skillId}
          </h1>
          <p className="text-gray-600">
            Quiz functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;