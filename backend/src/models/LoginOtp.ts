import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

const loginOtpSchema = new Schema<ILoginOtp>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
    length: 4,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired OTPs
loginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one active OTP per email
loginOtpSchema.index({ email: 1, isUsed: 1 });

export const LoginOtp = mongoose.model<ILoginOtp>('LoginOtp', loginOtpSchema);