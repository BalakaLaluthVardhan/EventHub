const nodemailer = require('nodemailer');

let transporter = null;

// Initialize transporter if SMTP configuration is provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = parseInt(process.env.SMTP_PORT || '2525', 10);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: port,
    secure: port === 465, // Use SSL/TLS for port 465, false for STARTTLS on other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Generic email sender helper
 */
async function sendMail({ to, subject, html }) {
  const from = process.env.FROM_EMAIL || 'noreply@collegeeventhub.edu';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html
      });
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Failed to send real email to ${to}:`, error);
      simulateSendMail({ from, to, subject, html });
    }
  } else {
    simulateSendMail({ from, to, subject, html });
  }
}

function simulateSendMail({ from, to, subject, html }) {
  console.log('\n============================================================');
  console.log('📧  [EMAIL SEND SIMULATION]');
  console.log(`    FROM:    ${from}`);
  console.log(`    TO:      ${to}`);
  console.log(`    SUBJECT: ${subject}`);
  console.log('------------------------------------------------------------');
  
  // Extract and print any links in the email for local development testing
  const links = [];
  const hrefRegex = /href="([^"]+)"/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  if (links.length > 0) {
    console.log('    LINKS FOUND:');
    links.forEach(link => console.log(`    🔗  ${link}`));
    console.log('------------------------------------------------------------');
  }

  // Strip HTML tags for clean console display
  const textSummary = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`    CONTENT: ${textSummary.substring(0, 180)}...`);
  console.log('============================================================\n');
}

/**
 * 1. Send Registration Confirmation Email
 */
async function sendRegistrationConfirmation(user, event) {
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center;">Registration Confirmed! 🎉</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>You have successfully registered for <strong>${event.title}</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${event.time}</p>
        <p style="margin: 5px 0;"><strong>📍 Venue:</strong> ${event.venue}</p>
        <p style="margin: 5px 0;"><strong>🎟️ Price:</strong> ${event.price === 0 ? 'Free' : `₹${event.price}`}</p>
      </div>
      <p>We look forward to seeing you there! You can download your calendar entry directly from the event page.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">College Event Hub &copy; 2026</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: `Confirmed: Registration for ${event.title}`,
    html
  });
}

/**
 * 2. Send Waitlist Notification Email
 */
async function sendWaitlistNotification(user, event) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #f59e0b; text-align: center;">Waitlisted Event 🎟️</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>You have been placed on the **Waitlist** for <strong>${event.title}</strong> because the event is currently at full capacity.</p>
      <p>If a registered attendee cancels, you will automatically be moved to the active registrations list and we will notify you immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">College Event Hub &copy; 2026</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: `Waitlist Update: ${event.title}`,
    html
  });
}

/**
 * 3. Send Event Update / Cancellation Email
 */
async function sendEventUpdateNotification(user, event, message) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">Important Event Update 📢</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>There is an important announcement regarding the event <strong>${event.title}</strong>:</p>
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0; color: #991b1b;">
        <p style="margin: 0; font-weight: bold;">Organizer Update:</p>
        <p style="margin: 5px 0 0 0;">${message}</p>
      </div>
      <p>Please update your calendar details accordingly.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">College Event Hub &copy; 2026</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: `Update regarding: ${event.title}`,
    html
  });
}

/**
 * 4. Send Attendance Confirmation Email
 */
async function sendAttendanceNotification(user, event) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #10b981; text-align: center;">Thank You for Attending! 🌟</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Thank you for attending <strong>${event.title}</strong>! We hope you had a fantastic and productive time.</p>
      <p>Your feedback is invaluable to us and helps organizers improve future activities. Please take a quick minute to share your thoughts and rate the event.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="http://localhost:3000/events/${event._id}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Leave a Review & Rating</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">College Event Hub &copy; 2026</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: `Feedback: How was ${event.title}?`,
    html
  });
}

/**
 * 5. Send Password Reset Email
 */
async function sendPasswordResetEmail(user, resetUrl) {
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #6366f1; text-align: center; font-size: 24px; margin-bottom: 20px;">Reset Your Password 🔒</h2>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">You are receiving this email because you (or someone else) requested a password reset for your account on <strong>College Event Hub</strong>.</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Please click the button below to complete the process. This link is valid for <strong>1 hour</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">Reset Password</a>
      </div>
      <p style="color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;">
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">College Event Hub &copy; 2026</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: 'Password Reset - College Event Hub',
    html
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendWaitlistNotification,
  sendEventUpdateNotification,
  sendAttendanceNotification,
  sendPasswordResetEmail
};
