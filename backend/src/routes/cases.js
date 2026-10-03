import { Router } from 'express';
import { Case } from '../models/Case.js';
import { SecureDocument } from '../models/Document.js';
import { recordAudit } from '../lib/audit.js';
import { escapeRegex } from '../lib/escapeRegex.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// -------------------------------------------------------------
// GET /api/cases - List & search cases (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.get('/', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), async (req, res) => {
  try {
    const { search, status, priority, risk, department, type } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (risk && risk !== 'all') query.risk = risk;
    if (department && department !== 'all') query.department = department;
    if (type && type !== 'all') query.type = type;

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { caseId: searchRegex },
        { title: searchRegex },
        { assignedOfficer: searchRegex },
        { description: searchRegex },
        { department: searchRegex },
      ];
    }

    const cases = await Case.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

    // Attach document counts dynamically
    const formatted = await Promise.all(
      cases.map(async (c) => {
        const count = await SecureDocument.countDocuments({ caseId: c.caseId });
        return {
          ...c,
          id: c._id,
          documentsCount: count || c.documentsCount || 0,
        };
      })
    );

    return res.json({ data: formatted, total: formatted.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch cases', details: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/cases/:id - Get single case with its documents (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.get('/:id', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('C-') ? { caseId: id } : { _id: id };
    const caseDoc = await Case.findOne(query).lean();

    if (!caseDoc) {
      return res.status(404).json({ error: `Case not found with ID ${id}` });
    }

    const documents = await SecureDocument.find({ caseId: caseDoc.caseId }).sort({ createdAt: -1 }).lean();

    return res.json({
      case: { ...caseDoc, id: caseDoc._id, documentsCount: documents.length },
      documents: documents.map((d) => ({ ...d, id: d._id })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve case details', details: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/cases - Create new case (Admin, Officer only)
// -------------------------------------------------------------
router.post('/', authenticate, authorizeRoles('Admin', 'Officer'), async (req, res) => {
  try {
    const {
      caseId,
      title,
      type = 'Investigation',
      description = '',
      department = 'Investigation',
      assignedOfficer,
      priority = 'Medium',
      confidentiality = 'Confidential',
      risk = 'Low',
      startDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Case title is required' });
    }

    // Auto-generate Case ID if not provided (e.g. C-1045)
    let finalCaseId = caseId ? caseId.trim().toUpperCase() : null;
    if (!finalCaseId) {
      const highestCase = await Case.findOne({ caseId: /^C-\d+$/ }).sort({ caseId: -1 }).lean();
      let nextNum = 1032;
      if (highestCase && highestCase.caseId) {
        const numPart = parseInt(highestCase.caseId.replace('C-', ''), 10);
        if (!isNaN(numPart)) nextNum = numPart + 1;
      }
      finalCaseId = `C-${nextNum}`;
    }

    const existing = await Case.findOne({ caseId: finalCaseId });
    if (existing) {
      return res.status(409).json({ error: `Case ID ${finalCaseId} already exists.` });
    }

    const newCase = await Case.create({
      caseId: finalCaseId,
      title: title.trim(),
      type,
      description: description.trim(),
      department,
      assignedOfficer: (assignedOfficer || req.user.name || 'Officer Raj Patel').trim(),
      priority,
      status: 'Active',
      risk,
      confidentiality,
      startDate: startDate ? new Date(startDate) : new Date(),
      documentsCount: 0,
      createdBy: req.user.name,
    });

    await recordAudit({
      action: 'CASE_CREATED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: finalCaseId,
      details: `New case registered: ${title} (${finalCaseId}) under ${department}`,
      result: 'Success',
    });

    return res.status(201).json({ ...newCase.toObject(), id: newCase._id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create case', details: err.message });
  }
});

// -------------------------------------------------------------
// PATCH /api/cases/:id/legal-status - Review/Update legal status (Admin, Officer, Legal Reviewer)
// -------------------------------------------------------------
router.patch('/:id/legal-status', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const query = id.startsWith('C-') ? { caseId: id } : { _id: id };
    const updated = await Case.findOneAndUpdate(query, { $set: { status } }, { returnDocument: 'after' }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await recordAudit({
      action: 'CASE_LEGAL_STATUS_UPDATED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: updated.caseId,
      details: `Case ${updated.caseId} legal status updated to "${status}" by ${req.user.name} (${req.user.role})`,
      result: 'Success',
    });

    return res.json({ ...updated, id: updated._id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update case legal status', details: err.message });
  }
});

// -------------------------------------------------------------
// PATCH /api/cases/:id - Update case details (Admin, Officer; Legal Reviewer restricted to status)
// -------------------------------------------------------------
router.patch('/:id', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('C-') ? { caseId: id } : { _id: id };

    // Legal Reviewer is strictly restricted to updating status
    if (req.user.role === 'Legal Reviewer') {
      const attemptedKeys = Object.keys(req.body).filter(
        (key) => req.body[key] !== undefined && key !== 'status'
      );
      if (attemptedKeys.length > 0) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
          error: `Forbidden: Legal Reviewer can only review and update legal status, not general case metadata [${attemptedKeys.join(', ')}].`,
        });
      }
    }

    const updateFields = {};
    const allowed = req.user.role === 'Legal Reviewer'
      ? ['status']
      : ['title', 'status', 'priority', 'risk', 'description', 'department', 'assignedOfficer', 'confidentiality'];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const updated = await Case.findOneAndUpdate(query, { $set: updateFields }, { returnDocument: 'after' }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await recordAudit({
      action: 'CASE_UPDATED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: updated.caseId,
      details: `Case ${updated.caseId} updated: ${Object.keys(updateFields).join(', ')} by ${req.user.name} (${req.user.role})`,
      result: 'Success',
    });

    return res.json({ ...updated, id: updated._id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update case', details: err.message });
  }
});

// -------------------------------------------------------------
// DELETE /api/cases/:id - Delete case (Admin only)
// -------------------------------------------------------------
router.delete('/:id', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('C-') ? { caseId: id } : { _id: id };

    const target = await Case.findOne(query);
    if (!target) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await Case.deleteOne({ _id: target._id });
    // Also remove associated documents
    await SecureDocument.deleteMany({ caseId: target.caseId });

    await recordAudit({
      action: 'CASE_DELETED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: target.caseId,
      details: `Case ${target.caseId} and all associated evidentiary documents deleted by Admin ${req.user.name}`,
      result: 'Success',
    });

    return res.json({ success: true, message: `Case ${target.caseId} deleted successfully` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete case', details: err.message });
  }
});

export default router;
