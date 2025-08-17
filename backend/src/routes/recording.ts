import { Router, Request, Response } from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

// Google Drive configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials (you'll need to implement OAuth flow)
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Upload recording to Google Drive and send emails
router.post('/upload', authenticate, adminOnly, upload.single('recording'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No recording file provided' });
    }

    const { meetingId, participants } = req.body;
    const filePath = req.file.path;
    const fileName = `Meeting-${meetingId}-${new Date().toISOString().split('T')[0]}.webm`;

    // Upload to Google Drive
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Create a folder for recordings
    };

    const media = {
      mimeType: 'video/webm',
      body: fs.createReadStream(filePath),
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = driveResponse.data.id;

    // Make file shareable
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const driveLink = `https://drive.google.com/file/d/${fileId}/view`;

    // Send emails to participants
    const participantList = JSON.parse(participants || '[]');
    const emailPromises = participantList.map(async (participant: any) => {
      if (participant.email) {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: participant.email,
          subject: `Meeting Recording - ${meetingId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Meeting Recording Available</h2>
              <p>Hello ${participant.name},</p>
              <p>The recording for your interview session (Meeting ID: <strong>${meetingId}</strong>) is now available.</p>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Meeting ID:</strong> ${meetingId}</p>
                <p style="margin: 10px 0 0 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <a href="${driveLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                View Recording
              </a>
              <p style="color: #6B7280; font-size: 14px;">
                This link will remain active for 30 days. Please download the recording if you need to keep it longer.
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="color: #6B7280; font-size: 12px;">
                This is an automated message from the Skill Assessment Portal.
              </p>
            </div>
          `,
        };

        return transporter.sendMail(mailOptions);
      }
    });

    await Promise.all(emailPromises.filter(Boolean));

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      driveLink,
      message: 'Recording uploaded and emails sent successfully',
    });

  } catch (error) {
    console.error('Recording upload error:', error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to upload recording',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get recording history
router.get('/history', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    // This would typically fetch from database
    // For now, return empty array
    res.json({
      success: true,
      recordings: [],
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

export default router;