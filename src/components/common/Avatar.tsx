import React from "react";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
  src?: string;
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  firstName,
  lastName,
  size = 48,
  src,
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e5e7eb",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #fbbf24 0%, #f472b6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.45,
        border: "2px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
};

export default Avatar;
