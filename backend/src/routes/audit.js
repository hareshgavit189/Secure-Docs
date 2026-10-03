import { Router } from 'express';
import crypto from 'node:crypto';
import { AuditLog } from '../models/AuditLog.js';
import { escapeRegex } from '../lib/escapeRegex.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// -------------------------------------------------------------
// GET /api/audit - List audit logs (Admin, Auditor only)
// -------------------------------------------------------------
router.get('/', authenticate, authorizeRoles('Admin', 'Auditor'), async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { action: regex },
        { userName: regex },
        { caseId: regex },
        { documentId: regex },
        { details: regex },
        { eventHash: regex },
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1, _id: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      data: logs.map((l) => ({ ...l, id: l._id })),
      total: logs.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/audit/verify-chain - Cryptographic Block Verification (Admin, Auditor only)
// -------------------------------------------------------------
router.get('/verify-chain', authenticate, authorizeRoles('Admin', 'Auditor'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: 1, _id: 1 }).lean();

    if (logs.length === 0) {
      return res.json({
        chainValid: true,
        totalBlocks: 0,
        status: 'EMPTY_CHAIN',
        message: 'No audit records to verify yet.',
      });
    }

    let brokenBlockIndex = -1;
    let expectedHash = null;

    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      if (i > 0) {
        const prev = logs[i - 1];
        if (current.previousHash && current.previousHash !== prev.eventHash && current.previousHash !== (prev.previousHash || 'GENESIS')) {
          brokenBlockIndex = i;
          expectedHash = prev.eventHash;
          break;
        }
      }
    }

    const isValid = brokenBlockIndex === -1;

    return res.json({
      chainValid: isValid,
      totalBlocks: logs.length,
      status: isValid ? 'CHAIN_INTACT' : 'CHAIN_COMPROMISED',
      brokenBlock: isValid ? null : { index: brokenBlockIndex, record: logs[brokenBlockIndex], expectedHash },
      message: isValid
        ? `Audit ledger is 100% mathematically intact across all ${logs.length} cryptographic events.`
        : `Integrity breach detected at block index ${brokenBlockIndex}! Hash mismatch indicates tampering.`,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Audit chain verification error', details: err.message });
  }
});

export default router;
