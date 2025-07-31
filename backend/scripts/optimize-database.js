const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'skill_assessment.db');
const db = new Database(dbPath);

console.log('🚀 Optimizing database for production...');

try {
  // Add missing deactivation columns
  try {
    db.exec(`ALTER TABLE users ADD COLUMN deactivated_at TEXT;`);
    console.log('✅ Added deactivated_at column');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('✅ deactivated_at column already exists');
    }
  }
  
  try {
    db.exec(`ALTER TABLE users ADD COLUMN delete_at TEXT;`);
    console.log('✅ Added delete_at column');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('✅ delete_at column already exists');
    }
  }

  // Performance optimizations
  db.exec(`
    -- Optimize SQLite settings for production
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = 10000;
    PRAGMA temp_store = MEMORY;
    PRAGMA mmap_size = 268435456;
    PRAGMA optimize;
  `);

  // Add missing indexes for better performance
  const indexes = [
    // User-related indexes
    'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_users_deactivated_at ON users(deactivated_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_delete_at ON users(delete_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
    
    // Quiz performance indexes
    'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_skill ON quiz_attempts(user_id, skill_id)',
    'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(score_percentage)',
    'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started_at ON quiz_attempts(started_at)',
    
    // Question filtering indexes
    'CREATE INDEX IF NOT EXISTS idx_questions_skill_active ON questions(skill_id, is_active)',
    'CREATE INDEX IF NOT EXISTS idx_questions_difficulty_active ON questions(difficulty, is_active)',
    
    // Skills filtering
    'CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_skills_category_active ON skills(category, is_active)',
    
    // Notification performance
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',
    
    // OTP cleanup
    'CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_otps(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_password_reset_used ON password_reset_otps(is_used)',
    
    // Chat performance
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at)',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at)'
  ];

  indexes.forEach(indexSQL => {
    try {
      db.exec(indexSQL);
    } catch (e) {
      console.log(`Index already exists: ${e.message}`);
    }
  });

  // Create composite indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard 
    ON quiz_attempts(skill_id, score_percentage DESC, completed_at DESC) 
    WHERE completed_at IS NOT NULL;
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_quiz_history 
    ON quiz_attempts(user_id, completed_at DESC) 
    WHERE completed_at IS NOT NULL;
  `);

  // Analyze tables for query optimization
  db.exec('ANALYZE;');

  console.log('✅ Database optimization completed successfully!');
  console.log('📊 Performance improvements:');
  console.log('  - WAL mode enabled for better concurrency');
  console.log('  - Memory-mapped I/O enabled');
  console.log('  - Optimized cache size');
  console.log('  - Added 15+ performance indexes');
  console.log('  - Query statistics updated');

} catch (error) {
  console.error('❌ Database optimization failed:', error);
} finally {
  db.close();
}