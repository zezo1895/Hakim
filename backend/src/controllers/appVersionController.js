const db = require('../config/db');
require('dotenv').config();

// In-memory store for OTPs
const otpStore = new Map();

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxN8O_8bb3yqfY-TyOkiC82b4_CAhlT0jl07X7nXF5CUvO1_Jq4JvnyWveNFWOC5MKk/exec';

// Helper to send email via Google Apps Script Webhook
const sendEmail = async (subject, body) => {
  const response = await fetch(GAS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, body }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email via Webhook');
  }
  return await response.json();
};

exports.getAppVersion = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM app_version WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json({
      latestVersion: rows[0].latest_version,
      downloadUrl: rows[0].download_url,
      forceUpdate: Boolean(rows[0].force_update),
      updatedAt: rows[0].updated_at
    });
  } catch (error) {
    console.error('Error fetching app version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.requestUpdate = async (req, res) => {
  try {
    // Validate admin secret
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== '123456') { // Used in Hakim App currently
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { downloadUrl } = req.body;
    if (!downloadUrl) {
      return res.status(400).json({ error: 'downloadUrl is required' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set('admin_update', { otp, expiry, downloadUrl });

    await sendEmail(
      'Hakim App - Update OTP Code',
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; direction: rtl; text-align: right;">
          <h2>طلب تحديث التطبيق</h2>
          <p>لقد تم طلب تحديث تطبيق حكيم جروب بالرابط الجديد.</p>
          <p>كود التحقق الخاص بك هو:</p>
          <h1 style="color: #1B7A3D; letter-spacing: 5px;">${otp}</h1>
          <p>هذا الكود صالح لمدة 10 دقائق فقط.</p>
        </div>
      `
    );

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Error requesting update:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

exports.confirmUpdate = async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== '123456') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const record = otpStore.get('admin_update');
    
    if (!record) {
      return res.status(400).json({ error: 'No update request pending or OTP expired' });
    }
    
    if (Date.now() > record.expiry) {
      otpStore.delete('admin_update');
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (record.otp !== otp.toString()) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid, proceed to update DB
    // First get current version
    const [rows] = await db.query('SELECT latest_version FROM app_version WHERE id = 1');
    let newVersion = '1.0.1'; // Default fallback
    
    if (rows.length > 0) {
      const currentVersion = rows[0].latest_version;
      // Increment minor version (e.g. 1.0.0 -> 1.0.1)
      const parts = currentVersion.split('.');
      if (parts.length === 3) {
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        const patch = parseInt(parts[2], 10);
        newVersion = `${major}.${minor}.${patch + 1}`;
      }
    }

    await db.query(
      'UPDATE app_version SET latest_version = ?, download_url = ? WHERE id = 1',
      [newVersion, record.downloadUrl]
    );

    // Clear OTP
    otpStore.delete('admin_update');

    res.json({ 
      message: 'App version updated successfully',
      newVersion,
      downloadUrl: record.downloadUrl
    });

  } catch (error) {
    console.error('Error confirming update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
