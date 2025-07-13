import React, { lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// User pages
import Dashboard from "./pages/user/Dashboard";
import QuizPage from "./pages/user/QuizPage";
import QuizHistory from "./pages/user/QuizHistory";
import QuizDetailPage from "./pages/user/QuizDetailPage";
import Leaderboard from "./pages/user/Leaderboard";
import Profile from "./pages/user/Profile";
import PublicProfile from "./pages/user/PublicProfile";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = React.lazy(() => import("./pages/user/AdminReports"));
const AdminUsers = React.lazy(() => import("./pages/user/AdminUsers"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="history" element={<QuizHistory />} />
                <Route path="quiz/:id" element={<QuizDetailPage />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="user/profile/:id" element={<PublicProfile />} />
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <AdminDashboard />
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/reports"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <AdminReports />
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <AdminUsers />
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/skills"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        {React.createElement(
                          lazy(() => import("./pages/admin/AdminSkills"))
                        )}
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/questions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        {React.createElement(
                          lazy(() => import("./pages/admin/AdminQuestions"))
                        )}
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
