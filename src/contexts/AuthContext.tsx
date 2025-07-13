import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "admin" | "user",
    adminPasscode?: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          const response = await authApi.getCurrentUser();
          setUser(response.data.data.user);
        } catch (error) {
          console.error("Auth initialization error:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("🔑 AuthContext: Starting login API call...");
      const response = await authApi.login({ email, password });
      console.log("📡 AuthContext: API response received:", response.data);

      const { user: userData, token: tokenData } = response.data.data;
      console.log("👤 AuthContext: User data:", userData);
      console.log(
        "🎟️ AuthContext: Token received:",
        tokenData ? "✅ Yes" : "❌ No"
      );

      localStorage.setItem("token", tokenData);
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("💾 AuthContext: Data saved to localStorage");

      setToken(tokenData);
      setUser(userData);
      console.log("✅ AuthContext: State updated successfully");
    } catch (error) {
      console.error("❌ AuthContext: Login error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "admin" | "user",
    adminPasscode?: string
  ): Promise<void> => {
    const payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "admin" | "user";
      adminPasscode?: string;
    } = {
      email,
      password,
      firstName,
      lastName,
      role,
    };
    if (role === "admin" && adminPasscode) {
      payload.adminPasscode = adminPasscode;
    }
    const response = await authApi.register(payload);
    const { user: userData, token: tokenData } = response.data.data;

    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
