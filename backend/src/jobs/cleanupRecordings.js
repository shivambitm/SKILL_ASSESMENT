const cron = require('node-cron');
const Meeting = require('../models/Meeting');

const cleanupJob = cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Starting daily recording cleanup...');
  
  try {
    const meetings = await Meeting.find({
      'recordings.expiryDate': { $lt: new Date() },
      'recordings.status': { $ne: 'expired' }
    });

    let cleanedCount = 0;
    
    for (const meeting of meetings) {
      await meeting.cleanupExpiredRecordings();
      const expiredCount = meeting.recordings.filter(r => 
        r.expiryDate < new Date() && r.status === 'expired'
      ).length;
      cleanedCount += expiredCount;
    }

    console.log(`✅ Cleanup completed: ${cleanedCount} recordings processed`);
  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
  }
}, {
  scheduled: false
});

const startCleanupJob = () => {
  cleanupJob.start();
  console.log('🕒 Recording cleanup job scheduled (daily at 2 AM)');
};

const runManualCleanup = async () => {
  console.log('🧹 Running manual cleanup...');
  cleanupJob.fireOnTick();
};

module.exports = {
  startCleanupJob,
  runManualCleanup
};