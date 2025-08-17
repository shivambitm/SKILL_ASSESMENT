console.log('🎤 [Transcription] Initializing transcription routes...');
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const Meeting = require('../models/Meeting');
const { authenticate } = require('../middleware/auth');
const transcriptionService = require('../services/transcriptionService');

// Middleware: auth & role check
function requireHost(req, res, next) {
  console.log('🔐 [Transcription] Checking host permissions for user:', req.user?.email);
  
  const { user } = req;
  if (!user) {
    console.error('❌ [Transcription] No user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!['admin','host'].includes(user.role)) {
    console.error('❌ [Transcription] User lacks host permissions:', user.role);
    return res.status(403).json({ error: 'Host only' });
  }
  
  console.log('✅ [Transcription] Host permissions verified');
  next();
}

router.post('/:roomId/transcribe-latest', authenticate, requireHost, async (req, res) => {
  const { roomId } = req.params;
  console.log('🎤 [Transcription] Starting transcription for room:', roomId);
  
  if (!transcriptionService.isAvailable()) {
    return res.status(503).json({ error: 'Transcription service not available - Google AI API key not configured' });
  }
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting || !meeting.recordings?.length) {
      console.error('❌ [Transcription] No recording found for room:', roomId);
      return res.status(404).json({ error: 'No recording found' });
    }
    
    const last = meeting.recordings[meeting.recordings.length - 1];
    if (last.status !== 'uploaded') {
      console.error('❌ [Transcription] Recording not ready for transcription:', last.status);
      return res.status(400).json({ error: 'Recording not ready for transcription' });
    }

    // Option 1: Download from Drive to tmp then transcribe
    // (Or transcode directly by streaming the download into OpenAI)
    // For brevity: assume we saved a local copy at RECORD_TMP_DIR when uploading.
    const localPath = path.join(process.env.RECORD_TMP_DIR || './tmp/recordings', `${roomId}-${new Date(last.startedAt).getTime()}.mp4`);

    if (!fs.existsSync(localPath)) {
      console.error('❌ [Transcription] Local recording file not found:', localPath);
      return res.status(404).json({ error: 'Recording file not found for transcription' });
    }

    // Transcribe audio using the transcription service
    const transcriptionResult = await transcriptionService.transcribeAudio(localPath, roomId);
    
    // Add transcript to meeting
    meeting.transcripts.push({
      text: transcriptionResult.text,
      speaker: 'Multiple Speakers',
      timestamp: new Date(),
      confidence: transcriptionResult.confidence
    });

    // Generate summary and action items using Gemini
    const summaryResult = await transcriptionService.generateSummaryAndActions(transcriptionResult.text);
    
    // Add summary to meeting
    meeting.summaries.push(summaryResult);
    await meeting.save();

    console.log('✅ [Transcription] Summary generated and saved with Gemini');
    res.json({ 
      ok: true, 
      transcriptChars: transcriptionResult.text.length,
      wordCount: transcriptionResult.wordCount,
      confidence: transcriptionResult.confidence,
      keyPoints: summaryResult.keyPoints.length,
      actionItems: summaryResult.actionItems.length,
      decisions: summaryResult.decisions.length,
      service: 'google-gemini'
    });
  } catch (error) {
    console.error('❌ [Transcription] Failed to transcribe:', error);
    res.status(500).json({ error: 'Failed to transcribe recording' });
  }
});

// Generate meeting insights using Gemini
router.post('/:roomId/insights', authenticate, async (req, res) => {
  const { roomId } = req.params;
  console.log('📊 [Transcription] Generating insights for room:', roomId);
  
  if (!transcriptionService.isAvailable()) {
    return res.status(503).json({ error: 'Transcription service not available' });
  }
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is participant or admin
    const participant = meeting.participants.find(p => p.email === req.user.email);
    if (!participant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!meeting.transcripts || meeting.transcripts.length === 0) {
      return res.status(400).json({ error: 'No transcripts available for analysis' });
    }

    // Get the latest transcript
    const latestTranscript = meeting.transcripts[meeting.transcripts.length - 1];
    const participantNames = meeting.participants.map(p => p.name);
    
    const insights = await transcriptionService.generateMeetingInsights(
      latestTranscript.text, 
      participantNames
    );

    res.json({ 
      ok: true, 
      insights,
      meetingId: roomId,
      participantCount: meeting.participants.length
    });
  } catch (error) {
    console.error('❌ [Transcription] Failed to generate insights:', error);
    res.status(500).json({ error: 'Failed to generate meeting insights' });
  }
});

// Get transcripts for a meeting
router.get('/:roomId/transcripts', authenticate, async (req, res) => {
  const { roomId } = req.params;
  console.log('📄 [Transcription] Getting transcripts for room:', roomId);
  
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

    res.json({ 
      ok: true, 
      transcripts: meeting.transcripts,
      summaries: meeting.summaries
    });
  } catch (error) {
    console.error('❌ [Transcription] Failed to get transcripts:', error);
    res.status(500).json({ error: 'Failed to get transcripts' });
  }
});

module.exports = router;