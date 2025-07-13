import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usersApi } from "../../services/api";
import Card from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { Shield } from "lucide-react";
import type { User } from "../../types";

const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getUser(Number(id));
        setUser(response.data.data.user);
      } catch (err: unknown) {
        if (typeof err === "object" && err !== null && "response" in err) {
          // @ts-expect-error error shape from axios is not typed
          setError(err.response?.data?.message || "User not found");
        } else {
          setError("User not found");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (error || !user) {
    return (
      <ErrorMessage
        message={error || "User not found"}
        className="text-center"
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card className="flex flex-col items-center p-8 glassmorphism-card">
        <Avatar firstName={user.firstName} lastName={user.lastName} size={96} />
        <h2
          className="mt-4 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {user.email}
        </p>
        <p
          className="text-sm capitalize mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <Shield className="w-4 h-4 inline mr-1" />
          {user.role}
        </p>
        {/* Add more public stats or badges here if available */}
      </Card>
    </div>
  );
};

export default PublicProfile;
