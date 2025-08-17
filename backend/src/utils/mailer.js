const nodemailer = require('nodemailer');

console.log('📧 [Mailer] Initializing email service...');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

console.log('✅ [Mailer] Email transporter configured');

async function sendRecordingEmail(to, subject, html) {
  console.log('📧 [Mailer] Sending email to:', to);
  
  try {
    const result = await transporter.sendMail({ 
      from: process.env.SMTP_USER, 
      to, 
      subject, 
      html 
    });
    
    console.log('✅ [Mailer] Email sent successfully to:', to);
    return result;
  } catch (error) {
    console.error('❌ [Mailer] Failed to send email:', error);
    throw error;
  }
}

module.exports = { sendRecordingEmail };