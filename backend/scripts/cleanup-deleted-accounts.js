const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Cleanup function to delete accounts past 30 days
function cleanupDeletedAccounts() {
  try {
    const now = new Date().toISOString();
    
    // Find accounts to delete
    const accountsToDelete = db.prepare(`
      SELECT id, email, first_name, last_name, delete_at 
      FROM users 
      WHERE is_active = 0 AND delete_at IS NOT NULL AND delete_at < ?
    `).all(now);
    
    if (accountsToDelete.length === 0) {
      console.log('✅ No accounts to delete');
      return;
    }
    
    console.log(`🗑️ Deleting ${accountsToDelete.length} expired accounts:`);
    accountsToDelete.forEach(account => {
      console.log(`- ${account.email} (${account.first_name} ${account.last_name})`);
    });
    
    // Delete the accounts
    const deleteStmt = db.prepare('DELETE FROM users WHERE is_active = 0 AND delete_at IS NOT NULL AND delete_at < ?');
    const result = deleteStmt.run(now);
    
    console.log(`✅ Successfully deleted ${result.changes} accounts`);
    
  } catch (error) {
    console.error('❌ Error cleaning up accounts:', error);
  } finally {
    db.close();
  }
}

// Run cleanup
cleanupDeletedAccounts();