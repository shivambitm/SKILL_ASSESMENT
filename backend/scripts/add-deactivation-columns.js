const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', 'skill_assessment.db');
console.log('Database path:', dbPath);
const db = new Database(dbPath);

try {
  // Check if users table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  console.log('Tables found:', tables);
  
  if (tables.length === 0) {
    console.log('⚠️ Users table not found. Creating it first...');
    // Create users table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deactivated_at TEXT,
        delete_at TEXT
      )
    `);
    console.log('✅ Users table created with deactivation columns');
  } else {
    console.log('🔧 Adding deactivation columns to existing users table...');
    
    // Add deactivated_at column
    try {
      db.exec(`ALTER TABLE users ADD COLUMN deactivated_at TEXT;`);
      console.log('✅ Added deactivated_at column');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('✅ deactivated_at column already exists');
      } else {
        throw e;
      }
    }
    
    // Add delete_at column
    try {
      db.exec(`ALTER TABLE users ADD COLUMN delete_at TEXT;`);
      console.log('✅ Added delete_at column');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('✅ delete_at column already exists');
      } else {
        throw e;
      }
    }
  }
  
  console.log('✅ Successfully configured deactivation columns');
  
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('✅ Columns already exist');
  } else {
    console.error('❌ Error adding columns:', error);
  }
} finally {
  db.close();
}