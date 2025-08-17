console.log('🎥 [Recording] Initializing recording routes...');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const Meeting = require('../models/Meeting');
const { uploadToDrive } = require('../utils/googleDrive');
const { sendRecordingEmail } = require('../utils/mailer');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const TMP_DIR = process.env.RECORD_TMP_DIR || './tmp/recordings';
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  console.log('📁 [Recording] Created recordings directory:', TMP_DIR);
}

// Middleware: auth & role check
function requireHost(req, res, next) {
  console.log('🔐 [Recording] Checking host permissions for user:', req.user?.email);
  
  const { user } = req;
  if (!user) {
    console.error('❌ [Recording] No user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!['admin','host'].includes(user.role)) {
    console.error('❌ [Recording] User lacks host permissions:', user.role);
    return res.status(403).json({ error: 'Host only' });
  }
  
  console.log('✅ [Recording] Host permissions verified');
  next();
}

// Start recording: create a placeholder record and signal your recorder worker
router.post('/:roomId/start', authenticate, requireHost, async (req, res) => {
  const { roomId } = req.params;
  console.log('🎥 [Recording] Starting recording for room:', roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      console.error('❌ [Recording] Meeting not found:', roomId);
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const recId = uuid();
    const recordName = `${roomId}-${Date.now()}.mp4`;
    const localPath = path.join(TMP_DIR, recordName);

    console.log('📝 [Recording] Creating recording record:', { recId, recordName, localPath });

    // TODO: Signal your recorder bot (SFU/native) to start and write to localPath
    // For POC you can use a client-side MediaRecorder upload stream — production: use SFU recording

    meeting.recordings.push({
      _id: recId,
      startedAt: new Date(),
      status: 'processing'
    });
    await meeting.save();

    console.log('✅ [Recording] Recording started successfully');
    res.json({ ok: true, recId, localPath });
  } catch (error) {
    console.error('❌ [Recording] Failed to start recording:', error);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

// Stop recording: upload to Drive, email, set expiry in 30 days
router.post('/:roomId/stop', authenticate, requireHost, async (req, res) => {
  const { roomId } = req.params;
  console.log('🛑 [Recording] Stopping recording for room:', roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      console.error('❌ [Recording] Meeting not found:', roomId);
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Assume last recording index
    const rec = meeting.recordings[meeting.recordings.length - 1];
    if (!rec) {
      console.error('❌ [Recording] No active recording found');
      return res.status(400).json({ error: 'No active recording' });
    }

    // Here ensure your recorder worker has finalized the file at localPath
    const recordName = `${roomId}-${rec.startedAt ? rec.startedAt.getTime() : Date.now()}.mp4`;
    const localPath = path.join(TMP_DIR, recordName);

    console.log('📤 [Recording] Uploading to Google Drive:', recordName);
    const { fileId, viewLink } = await uploadToDrive(localPath, recordName);
    
    rec.driveFileId = fileId;
    rec.driveViewLink = viewLink;
    rec.endedAt = new Date();
    rec.expiryAt = new Date(Date.now() + 30*24*60*60*1000);
    rec.status = 'uploaded';
    await meeting.save();

    console.log('📧 [Recording] Sending notification emails');
    // Email to all participants
    const subject = `Recording for ${meeting.title || meeting.roomId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎥 Meeting Recording Ready</h2>
        <p>Hello,</p>
        <p>Your meeting recording is now available for viewing:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" 
             style="background: #4285f4; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px;">
            📹 View Recording
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
          <p><strong>⚠️ Important:</strong> This recording will be automatically deleted in 30 days. Please download it before then.</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from Skill Assessment Portal.
        </p>
      </div>
    `;
    
    const recipients = meeting.participants.map(p => p.email).filter(Boolean);
    console.log('📧 [Recording] Sending to recipients:', recipients);
    
    await Promise.all(recipients.map(email => 
      sendRecordingEmail(email, subject, html).catch(err => 
        console.error(`❌ [Recording] Failed to send email to ${email}:`, err)
      )
    ));

    console.log('✅ [Recording] Recording stopped and processed successfully');
    res.json({ ok: true, driveViewLink: viewLink, expiryAt: rec.expiryAt });
  } catch (error) {
    console.error('❌ [Recording] Failed to stop recording:', error);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

// Get recordings for a meeting
router.get('/:roomId/recordings', authenticate, async (req, res) => {
  const { roomId } = req.params;
  console.log('📊 [Recording] Getting recordings for room:', roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is participant
    const participant = meeting.participants.find(p => p.email === req.user.email);
    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recordings = meeting.recordings.filter(r => r.status === 'uploaded');
    
    res.json({ 
      ok: true, 
      recordings: recordings.map(r => ({
        id: r._id,
        driveViewLink: r.driveViewLink,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        expiryAt: r.expiryAt,
        sizeBytes: r.sizeBytes
      }))
    });
  } catch (error) {
    console.error('❌ [Recording] Failed to get recordings:', error);
    res.status(500).json({ error: 'Failed to get recordings' });
  }
});

// Get recording status
router.get('/:roomId/status', authenticate, async (req, res) => {
  const { roomId } = req.params;
  console.log('📊 [Recording] Getting recording status for room:', roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const recordings = meeting.recordings.map(rec => ({
      id: rec._id,
      status: rec.status,
      startedAt: rec.startedAt,
      endedAt: rec.endedAt,
      expiryAt: rec.expiryAt,
      driveViewLink: rec.driveViewLink
    }));

    res.json({ ok: true, recordings });
  } catch (error) {
    console.error('❌ [Recording] Failed to get recording status:', error);
    res.status(500).json({ error: 'Failed to get recording status' });
  }
});

module.exports = router;