// Quick test to check environment variables
import dotenv from "dotenv";
dotenv.config();

console.log("Testing environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("JWT_SECRET exists:", process.env.JWT_SECRET ? "✅ Yes" : "❌ No");
console.log(
  "JWT_SECRET value:",
  process.env.JWT_SECRET?.substring(0, 20) + "..."
);

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment");
  process.exit(1);
} else {
  console.log("✅ JWT_SECRET is properly loaded");
}
