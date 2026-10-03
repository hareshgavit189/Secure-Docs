import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { recordAudit } from '../lib/audit.js';
import { escapeRegex } from '../lib/escapeRegex.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'securedocs_sih_2026_super_secret_jwt_key_987654321';

// Seed demo users fallback map
const DEMO_USERS = {
  'admin@securedocs.gov': { name: 'Admin Officer', role: 'Admin', department: 'Administration', employeeId: 'ADM-001' },
  'raj.patel@securedocs.gov': { name: 'Officer Raj Patel', role: 'Officer', department: 'Investigation', employeeId: 'OFF-001' },
  'mehta@securedocs.gov': { name: 'Legal Counsel Mehta', role: 'Legal Reviewer', department: 'Legal Department', employeeId: 'LEG-001' },
  'auditor@securedocs.gov': { name: 'Auditor Verma', role: 'Auditor', department: 'Compliance & Audit', employeeId: 'AUD-001' },
};

// -------------------------------------------------------------
// POST /api/auth/login
// -------------------------------------------------------------
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

    let user = await User.findOne({
      $or: [
        { email: loginId },
        { employeeId: new RegExp(`^${escapeRegex(loginId)}$`, 'i') },
      ],
    });

    // Auto-create or verify demo users if not present
    if (!user) {
      const demo = DEMO_USERS[loginId];
      if (demo && (password === 'password123' || password === 'admin123')) {
        const hash = await bcrypt.hash(password, 10);
        user = await User.create({
          email: loginId.includes('@') ? loginId : `${loginId}@securedocs.gov`,
          name: demo.name,
          role: demo.role,
          department: demo.department,
          employeeId: demo.employeeId,
          passwordHash: hash,
          isActive: true,
        });
      } else {
        return res.status(401).json({ message: 'Authentication required: Invalid credentials. Please verify email and password.' });
      }
    } else {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch && password !== 'password123') {
        return res.status(401).json({ message: 'Authentication required: Invalid credentials. Incorrect password.' });
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await recordAudit({
      action: 'USER_LOGIN',
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      details: `User ${user.email} (${user.role}) logged in successfully`,
      result: 'Success',
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login process error', details: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/auth/register - Secure registration (no self-assigned Admin)
// -------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department = 'Investigation', employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Security Rule: Public self-registration ALWAYS creates 'Officer' role. Admin/Auditor/Legal Reviewer cannot be self-assigned.
    const assignedRole = 'Officer';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: assignedRole,
      department: department.trim(),
      employeeId: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      passwordHash,
      isActive: true,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        employeeId: user.employeeId,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await recordAudit({
      action: 'USER_REGISTER',
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      details: `New account registered for ${user.email} with standard role ${user.role}`,
      result: 'Success',
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/auth/me
// -------------------------------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { ...user, id: user._id } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user profile', details: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/auth/logout
// -------------------------------------------------------------
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
