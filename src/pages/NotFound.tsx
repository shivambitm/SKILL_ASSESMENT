import React from "react";
import { useLocation } from "react-router-dom";

const NotFound: React.FC = () => {
  const location = useLocation();
  // Optionally, you can get error details from location.state if set by router
  const errorMsg =
    (location.state && location.state.errorMsg) ||
    `The page '${location.pathname}' was not found.`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404 - Not Found</h1>
      <p className="text-lg text-gray-700 mb-2">{errorMsg}</p>
      <p className="text-gray-500 mb-6">
        Sorry, the page you are looking for does not exist or an error occurred.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Home
      </a>
    </div>
  );
};

export default NotFound;
