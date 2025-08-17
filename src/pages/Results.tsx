import React from 'react';

const Results: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Quiz Results
          </h1>
          <p className="text-gray-600">
            Results will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;