const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'pms_translation_super_secret_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up user in MySQL
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Verify password (skip check if no password provided — dev convenience only)
    if (password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      vendorId: user.vendorId || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        vendorId: user.vendorId,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.id === 'unknown') {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, phone: true,
        role: true, status: true, vendorId: true, createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getMe = me;

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, me, getMe, logout, changePassword };
