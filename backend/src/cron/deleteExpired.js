console.log('🕒 [Cron] Initializing expired recordings cleanup job...');
const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const { deleteFromDrive } = require('../utils/googleDrive');

function startExpiryCron() {
  console.log('🕒 [Cron] Setting up daily cleanup schedule...');
  
  cron.schedule('0 3 * * *', async () => { // daily at 03:00
    console.log('🧹 [Cron] Starting expired recordings cleanup...');
    
    try {
      const meetings = await Meeting.find({ 'recordings.expiryAt': { $lte: new Date() } });
      console.log(`🔍 [Cron] Found ${meetings.length} meetings with expired recordings`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const meeting of meetings) {
        for (const recording of meeting.recordings) {
          if (recording.status === 'uploaded' && recording.expiryAt && recording.expiryAt <= new Date()) {
            try {
              console.log(`🗑️ [Cron] Deleting expired recording: ${recording.driveFileId}`);
              await deleteFromDrive(recording.driveFileId);
              recording.status = 'deleted';
              deletedCount++;
              console.log(`✅ [Cron] Successfully deleted recording: ${recording.driveFileId}`);
            } catch (error) {
              console.error(`❌ [Cron] Failed to delete recording ${recording.driveFileId}:`, error);
              recording.status = 'failed';
              failedCount++;
            }
          }
        }
        await meeting.save();
      }
      
      console.log(`✅ [Cron] Cleanup completed: ${deletedCount} deleted, ${failedCount} failed`);
    } catch (error) {
      console.error('❌ [Cron] Cleanup job failed:', error);
    }
  });
  
  console.log('✅ [Cron] Expired recordings cleanup job scheduled for 03:00 daily');
}

module.exports = { startExpiryCron };