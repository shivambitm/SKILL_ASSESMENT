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
import { ToastProvider } from "./contexts/ToastContext";
import { GoogleAuthProvider } from "./contexts/GoogleAuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Legal pages
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Cancellation from "./pages/legal/Cancellation";
import Delivery from "./pages/legal/Delivery";
import Policy from "./pages/legal/Policy";

// User pages
import Dashboard from "./pages/user/Dashboard";
import QuizPage from "./pages/user/QuizPage";
import QuizHistory from "./pages/user/QuizHistory";
import QuizDetailPage from "./pages/user/QuizDetailPage";
import Leaderboard from "./pages/user/Leaderboard";
import Profile from "./pages/user/Profile";
import PublicProfile from "./pages/user/PublicProfile";
import JoinMeeting from "./pages/JoinMeeting";
import NotFound from "./pages/NotFound";

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
        <ToastProvider>
          <GoogleAuthProvider>
            <AuthProvider>
              <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/join/:meetingId" element={<JoinMeeting />} />
              
              {/* Legal pages */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cancellation" element={<Cancellation />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/policy" element={<Policy />} />

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
                <Route
                  path="admin/virtual-rounds"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        {React.createElement(
                          lazy(() => import("./components/admin/VirtualRounds"))
                        )}
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/ai-chat"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <React.Suspense fallback={<div>Loading...</div>}>
                        {React.createElement(
                          lazy(() => import("./components/admin/AIChat"))
                        )}
                      </React.Suspense>
                    </ProtectedRoute>
                  }
                />
                
                {/* Catch-all for any unmatched routes inside protected area */}
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* Final catch-all for completely unmatched routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
              </Router>
            </AuthProvider>
          </GoogleAuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
