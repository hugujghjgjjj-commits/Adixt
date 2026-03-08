import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// In-memory store for OTPs. In production, use Redis or a database.
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(email.toLowerCase(), { otp, expiresAt });

  try {
    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Your Login OTP',
        text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
        html: `<p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p><p>It expires in 5 minutes.</p>`,
      });
    } else {
      // Fallback for development if SMTP is not configured
      console.log(`\n=========================================`);
      console.log(`[DEV MODE] OTP for ${email} is: ${otp}`);
      console.log(`=========================================\n`);
    }
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = otpStore.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // OTP is valid, remove it so it can't be reused
  otpStore.delete(email.toLowerCase());
  
  res.json({ success: true, message: 'OTP verified successfully' });
});

export default router;
