import { pool } from "../src/config/database";

async function seedUsers() {
  const users = [
    {
      first_name: "Alice",
      last_name: "Smith",
      email: "alice@example.com",
      password: "password123", // In production, use hashed passwords!
      role: "user",
      is_active: 1,
    },
    {
      first_name: "Bob",
      last_name: "Johnson",
      email: "bob@example.com",
      password: "password123",
      role: "user",
      is_active: 1,
    },
    {
      first_name: "Charlie",
      last_name: "Brown",
      email: "charlie@example.com",
      password: "password123",
      role: "user",
      is_active: 1,
    },
  ];

  for (const user of users) {
    await pool.execute(
      `INSERT OR IGNORE INTO users (first_name, last_name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.first_name,
        user.last_name,
        user.email,
        user.password,
        user.role,
        user.is_active,
      ]
    );
  }

  console.log("Seeded users successfully!");
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
