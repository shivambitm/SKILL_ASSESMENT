import { LoginOtp } from '../models';

export const cleanupExpiredOTPs = async () => {
  try {
    const result = await LoginOtp.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true }
      ]
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired/used OTPs`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up OTPs:', error);
  }
};

// Run cleanup every 5 minutes
export const startOTPCleanupJob = () => {
  setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
  console.log('🔄 OTP cleanup job started (runs every 5 minutes)');
};