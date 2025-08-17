const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'studyhardshivam@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `"Skill Assessment Portal" <${process.env.GMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  async sendBulkEmail(recipients, { subject, html }) {
    const promises = recipients.map(email => 
      this.sendEmail(email, subject, html).catch(err => 
        console.error(`Failed to send to ${email}:`, err)
      )
    );
    
    await Promise.allSettled(promises);
  }

  async sendMeetingInvite(participants, meetingData) {
    const { roomId, title, hostEmail, meetingUrl } = meetingData;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎥 You're Invited to a Video Interview</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Meeting Details:</h3>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Meeting ID:</strong> ${roomId}</p>
          <p><strong>Host:</strong> ${hostEmail}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingUrl}" 
             style="background: #28a745; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px;">
            🚀 Join Meeting
          </a>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px;">
          <p><strong>📋 Before joining:</strong></p>
          <ul>
            <li>Test your camera and microphone</li>
            <li>Ensure stable internet connection</li>
            <li>Join from a quiet environment</li>
            <li>Have your resume/documents ready</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Powered by Skill Assessment Portal
        </p>
      </div>
    `;

    await this.sendBulkEmail(participants, {
      subject: `Interview Invitation - ${title}`,
      html
    });
  }
}

module.exports = new EmailService();