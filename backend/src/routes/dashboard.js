import { Router } from 'express';
import { Case } from '../models/Case.js';
import { SecureDocument } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';

const router = Router();

// -------------------------------------------------------------
// GET /api/dashboard/stats - Executive metrics
// -------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const [totalCases, totalDocs, pendingDocs, verifiedDocs, recentAudits, activeCases] = await Promise.all([
      Case.countDocuments(),
      SecureDocument.countDocuments(),
      SecureDocument.countDocuments({ status: 'Pending Review' }),
      SecureDocument.countDocuments({ integrity: 'Verified' }),
      AuditLog.find().sort({ timestamp: -1, _id: -1 }).limit(6).lean(),
      Case.countDocuments({ status: 'Active' }),
    ]);

    const integrityRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 100;

    return res.json({
      totalCases,
      totalDocuments: totalDocs,
      pendingReviews: pendingDocs,
      integrityRate: `${integrityRate}%`,
      activeCases,
      recentAudits: recentAudits.map((a) => ({ ...a, id: a._id })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to aggregate dashboard metrics', details: err.message });
  }
});

export default router;
