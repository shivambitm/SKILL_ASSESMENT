import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // console.log("🛡️ ProtectedRoute: Checking access...");
  // console.log("⏳ Loading:", loading);
  // console.log("👤 User:", user);
  // console.log("📍 Current location:", location.pathname);

  if (loading) {
    // console.log("⏳ Still loading, showing spinner...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // console.log("❌ No user found, redirecting to login...");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (typeof user.role !== "string") {
    // console.log("❌ Invalid user object, redirecting to login...");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // console.log("🚫 Insufficient role, redirecting to dashboard...");
    return <Navigate to="/dashboard" replace />;
  }

  // console.log("✅ Access granted, rendering children...");
  return <>{children}</>;
};

export default ProtectedRoute;
