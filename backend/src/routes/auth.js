import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { recordAudit } from '../utils/audit.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = Router();
const JWT_SECRET = config.jwtSecret;

// ─────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, employeeId, password } = req.body;
    const loginId = (identifier || email || employeeId || '').trim().toLowerCase();

    if (!loginId) {
      return res.status(400).json({ error: 'Email or Employee ID is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by email OR employeeId
    const user = await User.findOne({
      $or: [
        { email: loginId },
        { employeeId: new RegExp(`^${escapeRegex(loginId)}$`, 'i') },
      ],
    });

    // BUG FIX #1: Removed undefined DEMO_USERS reference — properly return 401
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. No account found with this email or Employee ID.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Contact your administrator.' });
    }

    // BUG FIX #3: Removed password bypass — only use bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      {
        userId:     user._id,
        email:      user.email,
        role:       user.role,
        name:       user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await recordAudit({
      action:    'USER_LOGIN',
      userId:    user._id.toString(),
      userName:  user.name,
      userRole:  user.role,
      details:   `User ${user.email} (${user.role}) logged in successfully`,
      result:    'Success',
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      token,
      user: {
        id:         user._id,
        _id:        user._id,
        email:      user.email,
        name:       user.name,
        role:       user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login process error', details: err.message });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    // BUG FIX #2: Added employeeId to destructuring (was undefined before)
    const { name, email, password, role, department, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      role:       role || 'Officer',
      department: department || 'Investigation',
      employeeId: employeeId?.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      passwordHash,
      isActive:   true,
    });

    const token = jwt.sign(
      {
        userId:     user._id,
        email:      user.email,
        role:       user.role,
        name:       user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await recordAudit({
      action:   'USER_REGISTER',
      userId:   user._id.toString(),
      userName: user.name,
      userRole: user.role,
      details:  `New account registered for ${user.email} with role ${user.role}`,
      result:   'Success',
    });

    return res.status(201).json({
      token,
      user: {
        id:         user._id,
        _id:        user._id,
        email:      user.email,
        name:       user.name,
        role:       user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { ...user, id: user._id } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user profile', details: err.message });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
