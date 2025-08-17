console.log('📧 [SummaryEmail] Initializing summary email routes...');
const router = require('express').Router();
const Meeting = require('../models/Meeting');
const { sendRecordingEmail } = require('../utils/mailer');
const { authenticate } = require('../middleware/auth');

// Middleware: auth & role check
function requireHost(req, res, next) {
  console.log('🔐 [SummaryEmail] Checking host permissions for user:', req.user?.email);
  
  const { user } = req;
  if (!user) {
    console.error('❌ [SummaryEmail] No user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!['admin','host'].includes(user.role)) {
    console.error('❌ [SummaryEmail] User lacks host permissions:', user.role);
    return res.status(403).json({ error: 'Host only' });
  }
  
  console.log('✅ [SummaryEmail] Host permissions verified');
  next();
}

router.post('/:roomId/send-summary', authenticate, requireHost, async (req, res) => {
  const { roomId } = req.params;
  console.log('📧 [SummaryEmail] Sending summary email for room:', roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      console.error('❌ [SummaryEmail] Meeting not found:', roomId);
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const latestSum = meeting.summaries[meeting.summaries.length - 1];
    const latestRec = meeting.recordings[meeting.recordings.length - 1];

    if (!latestSum) {
      console.error('❌ [SummaryEmail] No summary found for meeting:', roomId);
      return res.status(404).json({ error: 'No summary found' });
    }

    console.log('📧 [SummaryEmail] Preparing summary email...');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>📋 Meeting Summary: ${meeting.title || roomId}</h2>
        
        ${latestRec?.driveViewLink ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${latestRec.driveViewLink}" 
               style="background: #4285f4; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              🎥 View Recording
            </a>
          </div>
        ` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📝 Meeting Highlights</h3>
          <ul>
            ${(latestSum?.bullets || []).map(b => `<li>${b.replace(/^[-•]\\s*/, '')}</li>`).join('')}
          </ul>
        </div>
        
        ${latestSum?.actionItems?.length > 0 ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Action Items</h3>
            <ul>
              ${latestSum.actionItems.map(ai => `<li><strong>${ai.assignee || 'Unassigned'}:</strong> ${ai.text}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${latestRec?.expiryAt ? `
          <div style="background: #f8d7da; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p><strong>⚠️ Important:</strong> Recording will be deleted on ${new Date(latestRec.expiryAt).toLocaleDateString()}. Please download before then.</p>
          </div>
        ` : ''}
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated summary from Skill Assessment Portal.
        </p>
      </div>
    `;

    const recipients = meeting.participants.map(p => p.email).filter(Boolean);
    console.log('📧 [SummaryEmail] Sending to recipients:', recipients);
    
    await Promise.all(recipients.map(email => 
      sendRecordingEmail(email, `Meeting Summary: ${meeting.title || roomId}`, html).catch(err => 
        console.error(`❌ [SummaryEmail] Failed to send to ${email}:`, err)
      )
    ));
    
    console.log('✅ [SummaryEmail] Summary emails sent successfully');
    res.json({ ok: true, recipients: recipients.length });
  } catch (error) {
    console.error('❌ [SummaryEmail] Failed to send summary:', error);
    res.status(500).json({ error: 'Failed to send summary' });
  }
});

module.exports = router;