import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetOtp extends Document {
  email: string;
  otp: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

const PasswordResetOtpSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  is_used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for performance and cleanup
PasswordResetOtpSchema.index({ email: 1 });
PasswordResetOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordResetOtp>('PasswordResetOtp', PasswordResetOtpSchema);