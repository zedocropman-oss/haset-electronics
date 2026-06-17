// utils/mailer.js — Nodemailer email helper
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send a new-registration notification email to the shop owner.
 */
async function sendRegistrationNotification(reg) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[mailer] SMTP not configured — skipping email.');
    return;
  }

  const transporter = createTransporter();
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"HASET ELECTRONICS" <${process.env.SMTP_USER}>`,
    to,
    subject: `📋 New registration: ${reg.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px">
        <h2 style="color:#1D9E75;margin-top:0">New Customer Registration</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#888;width:130px">Name</td><td style="padding:6px 0;font-weight:600">${reg.name}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0;font-weight:600">${reg.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0">${reg.email || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#888">City / Kebele</td><td style="padding:6px 0">${reg.city || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Services</td><td style="padding:6px 0">${reg.services}</td></tr>
          <tr><td style="padding:6px 0;color:#888;vertical-align:top">Notes</td><td style="padding:6px 0">${reg.notes || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#aaa;margin-top:20px">Received ${new Date().toLocaleString()} · HASET ELECTRONICS, Tunto Hadero</p>
      </div>
    `,
  });
}

/**
 * Send a confirmation SMS-style email to the customer (if email provided).
 */
async function sendCustomerConfirmation(reg) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !reg.email) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"HASET ELECTRONICS" <${process.env.SMTP_USER}>`,
    to: reg.email,
    subject: 'We received your registration — HASET ELECTRONICS',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px">
        <h2 style="color:#1D9E75;margin-top:0">Thank you, ${reg.name}!</h2>
        <p style="font-size:14px;color:#444">We have received your registration for the following service(s):</p>
        <p style="font-size:15px;font-weight:600;color:#1a1a1a">${reg.services}</p>
        <p style="font-size:14px;color:#444">We will contact you shortly on <strong>${reg.phone}</strong>.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0"/>
        <p style="font-size:13px;color:#888">📍 Tunto Hadero, Central Ethiopia<br>📞 0919 337 228 / 0921 913 067</p>
      </div>
    `,
  });
}

module.exports = { sendRegistrationNotification, sendCustomerConfirmation };
