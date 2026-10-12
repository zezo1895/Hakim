const crypto = require('crypto');
const db = require('../config/db');
require('dotenv').config();

// Helper for timing-safe string comparison
const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// In-memory store for OTPs
const otpStore = new Map();

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
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || !expectedSecret || !safeCompare(adminSecret, expectedSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { downloadUrl, version } = req.body;
    if (!downloadUrl) {
      return res.status(400).json({ error: 'downloadUrl is required' });
    }

    const isAllowedDomain = typeof downloadUrl === 'string' && (
      downloadUrl.startsWith('https://github.com/zezo1895/') ||
      downloadUrl.startsWith('https://expo.dev/')
    );
    if (!isAllowedDomain) {
      return res.status(400).json({ error: 'Untrusted download URL domain' });
    }

    let targetVersion = version;
    if (!targetVersion) {
      const [rows] = await db.query('SELECT latest_version FROM app_version WHERE id = 1');
      if (rows.length > 0) {
        const parts = rows[0].latest_version.split('.');
        if (parts.length === 3) {
          targetVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2], 10) + 1}`;
        }
      }
      targetVersion = targetVersion || '1.0.1';
    }

    await db.query(
      'UPDATE app_version SET latest_version = ?, download_url = ? WHERE id = 1',
      [targetVersion, downloadUrl]
    );

    res.json({ message: 'App version updated successfully', newVersion: targetVersion, downloadUrl });
  } catch (error) {
    console.error('Error requesting update:', error);
    res.status(500).json({ error: 'Failed to update version' });
  }
};

exports.confirmUpdate = async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || !expectedSecret || !safeCompare(adminSecret, expectedSecret)) {
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

exports.ciUpdate = async (req, res) => {
  try {
    const secret = req.headers['x-admin-secret'] || req.headers['x-ci-secret'];
    const expectedSecret = process.env.ADMIN_SECRET || process.env.CI_SECRET;
    if (!secret || !expectedSecret || !safeCompare(secret, expectedSecret)) {
      return res.status(401).json({ error: 'Unauthorized CI' });
    }

    const { downloadUrl, version } = req.body;
    if (!downloadUrl || !version) {
      return res.status(400).json({ error: 'downloadUrl and version are required' });
    }

    // Security check: Only allow APK downloads from official trusted sources
    const isAllowedDomain = typeof downloadUrl === 'string' && (
      downloadUrl.startsWith('https://github.com/zezo1895/') ||
      downloadUrl.startsWith('https://expo.dev/')
    );
    if (!isAllowedDomain) {
      return res.status(400).json({ error: 'Untrusted download URL domain' });
    }

    await db.query(
      'UPDATE app_version SET latest_version = ?, download_url = ? WHERE id = 1',
      [version, downloadUrl]
    );

    res.json({ 
      message: 'App version updated successfully via CI',
      newVersion: version,
      downloadUrl: downloadUrl
    });

  } catch (error) {
    console.error('Error in CI update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logError = (req, res) => {
  console.error('=========================================');
  console.error('📱 MOBILE APP ERROR LOG:', req.body);
  console.error('=========================================');
  res.json({ success: true });
};

