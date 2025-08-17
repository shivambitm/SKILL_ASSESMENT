const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const googleDrive = require('./googleDrive');
const emailService = require('./emailService');

class RecordingService {
  constructor() {
    this.activeRecordings = new Map();
  }

  async startRecording(roomId, meetingUrl) {
    try {
      console.log(`🎥 Starting recording for room ${roomId}`);
      
      const outputPath = path.join(__dirname, '../../recordings', `${roomId}-${Date.now()}.mp4`);
      
      // Ensure recordings directory exists
      const recordingsDir = path.dirname(outputPath);
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }

      // Launch headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--autoplay-policy=no-user-gesture-required'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for recording
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to meeting
      await page.goto(meetingUrl, { waitUntil: 'networkidle0' });
      
      // Auto-join as recorder bot
      await page.evaluate(() => {
        // Simulate joining meeting as recorder
        if (window.webRTCService) {
          window.webRTCService.joinMeeting(window.meetingId, {
            name: 'Recording Bot',
            email: 'recorder@system.local',
            isHost: false
          });
        }
      });

      // Start screen recording
      const recordingProcess = ffmpeg()
        .input(':0.0') // X11 display
        .inputOptions([
          '-f x11grab',
          '-s 1920x1080',
          '-r 30'
        ])
        .output(outputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k'
        ])
        .on('start', () => {
          console.log(`✅ Recording started: ${outputPath}`);
        })
        .on('error', (err) => {
          console.error('❌ Recording error:', err);
        })
        .on('end', () => {
          console.log('✅ Recording completed');
        });

      recordingProcess.run();

      // Store recording info
      this.activeRecordings.set(roomId, {
        browser,
        page,
        recordingProcess,
        outputPath,
        startTime: new Date()
      });

      return { success: true, outputPath };
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(roomId, meeting) {
    try {
      const recording = this.activeRecordings.get(roomId);
      if (!recording) {
        throw new Error('No active recording found');
      }

      console.log(`🛑 Stopping recording for room ${roomId}`);

      // Stop FFmpeg process
      recording.recordingProcess.kill('SIGINT');
      
      // Close browser
      await recording.browser.close();
      
      // Wait for file to be written
      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = new Date();
      const duration = Math.floor((endTime - recording.startTime) / 1000);
      const fileName = `${meeting.title}-${roomId}-${recording.startTime.toISOString().split('T')[0]}.mp4`;

      // Upload to Google Drive
      const driveResult = await googleDrive.uploadRecording(
        recording.outputPath,
        fileName,
        roomId
      );

      // Update meeting with recording info
      const recordingData = {
        driveFileId: driveResult.fileId,
        driveUrl: driveResult.webViewLink,
        fileName,
        startTime: recording.startTime,
        endTime,
        duration,
        fileSize: driveResult.fileSize,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'ready'
      };

      meeting.recordings.push(recordingData);
      meeting.isRecording = false;
      await meeting.save();

      // Send emails to participants
      await this.sendRecordingEmails(meeting, recordingData);

      // Clean up local file
      fs.unlinkSync(recording.outputPath);
      
      // Remove from active recordings
      this.activeRecordings.delete(roomId);

      return recordingData;
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      throw error;
    }
  }

  async sendRecordingEmails(meeting, recording) {
    try {
      // Send to configured recording email instead of all participants
      const recordingEmail = process.env.RECORDING_EMAIL || 'studyhardshivam@gmail.com';
      const recipients = [recordingEmail];
      
      const emailData = {
        subject: `Meeting Recording Available - ${meeting.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Meeting Recording Ready</h2>
            <p>A new meeting recording is available for download.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Meeting Details:</h3>
              <p><strong>Title:</strong> ${meeting.title}</p>
              <p><strong>Room ID:</strong> ${meeting.roomId}</p>
              <p><strong>Date:</strong> ${recording.startTime.toLocaleDateString()}</p>
              <p><strong>Duration:</strong> ${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s</p>
              <p><strong>Participants:</strong> ${meeting.participants.length}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${recording.driveUrl}" 
                 style="background: #4285f4; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                📹 View Recording
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
              <p><strong>⚠️ Important:</strong> This recording will be automatically deleted after 30 days 
                 (${recording.expiryDate.toLocaleDateString()}). Please download it before then.</p>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message from Skill Assessment Portal.
            </p>
          </div>
        `
      };

      await emailService.sendBulkEmail(recipients, emailData);
      console.log(`✅ Recording email sent to ${recordingEmail}`);
    } catch (error) {
      console.error('❌ Failed to send recording email:', error);
    }
  }
}

module.exports = new RecordingService();