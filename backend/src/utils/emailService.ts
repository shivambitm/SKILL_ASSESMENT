import * as nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Skill Assessment Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Skill Assessment Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Skill Assessment Portal</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #374151; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Use the OTP below to verify your identity:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your OTP Code</p>
              <h1 style="margin: 10px 0 0 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 Skill Assessment Portal. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};