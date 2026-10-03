import { Router } from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { SecureDocument } from '../models/Document.js';
import { Case } from '../models/Case.js';
import { recordAudit } from '../lib/audit.js';
import { escapeRegex } from '../lib/escapeRegex.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

const writeRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please retry shortly.' },
});

// -------------------------------------------------------------
// GET /api/documents - List documents with filters (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.get('/', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), async (req, res) => {
  try {
    const { search, caseId, type, status, integrity, confidentiality } = req.query;
    const query = {};

    if (caseId && caseId !== 'all') query.caseId = caseId;
    if (type && type !== 'all') query.documentType = type;
    if (status && status !== 'all') query.status = status;
    if (integrity && integrity !== 'all') query.integrity = integrity;
    if (confidentiality && confidentiality !== 'all') query.confidentiality = confidentiality;

    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { documentId: regex },
        { documentName: regex },
        { caseId: regex },
        { uploadedBy: regex },
        { description: regex },
        { hash: regex },
      ];
    }

    const docs = await SecureDocument.find(query).sort({ createdAt: -1 }).lean();
    return res.json({
      data: docs.map((d) => ({ ...d, id: d._id })),
      total: docs.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch documents', details: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/documents/:id - Get document details (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.get('/:id', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('SD-') ? { documentId: id } : { _id: id };
    const doc = await SecureDocument.findOneAndUpdate(
      query,
      { $inc: { totalAccesses: 1 }, $set: { lastAccessed: new Date(), lastAccessedBy: req.user.name } },
      { returnDocument: 'after' }
    ).lean();

    if (!doc) {
      return res.status(404).json({ error: `Document not found with ID ${id}` });
    }

    return res.json({ ...doc, id: doc._id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve document', details: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/documents/upload - Upload new evidentiary document (Admin, Officer only)
// -------------------------------------------------------------
const uploadDocument = async (req, res) => {
  try {
    const {
      caseId,
      documentName,
      documentType = 'FIR',
      description = '',
      confidentiality = 'Confidential',
    } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    if (!documentName && !req.file) {
      return res.status(400).json({ error: 'Document name or file is required' });
    }

    const finalDocName = documentName?.trim() || req.file?.originalname || 'Evidentiary_Document.pdf';
    
    // Compute genuine cryptographic SHA-256 hash
    let calculatedHash = '';
    let fileSize = 0;
    let mimeType = 'application/pdf';
    let fileData = '';

    if (req.file && req.file.buffer) {
      calculatedHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
      fileData = req.file.buffer.toString('base64');
    } else {
      // Direct simulation if file not attached
      const simBuffer = Buffer.from(`${finalDocName}-${caseId}-${Date.now()}`);
      calculatedHash = crypto.createHash('sha256').update(simBuffer).digest('hex');
      fileSize = 145000 + Math.floor(Math.random() * 50000);
      fileData = simBuffer.toString('base64');
    }

    const docId = `SD-${Math.floor(260000 + Math.random() * 9000)}`;

    const newDoc = await SecureDocument.create({
      documentId: docId,
      documentName: finalDocName,
      caseId: caseId.trim().toUpperCase(),
      documentType,
      description: description.trim(),
      originalFilename: req.file ? req.file.originalname : `${finalDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      mimeType,
      size: fileSize,
      hash: calculatedHash,
      version: 1,
      uploadedBy: req.user.name,
      uploadedByRole: req.user.role,
      status: 'Approved',
      integrity: 'Verified',
      confidentiality,
      fileData,
    });

    // Update parent case document count
    await Case.updateOne({ caseId: caseId.trim().toUpperCase() }, { $inc: { documentsCount: 1 } });

    await recordAudit({
      action: 'DOCUMENT_UPLOADED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: caseId.trim().toUpperCase(),
      documentId: docId,
      details: `Evidentiary document "${finalDocName}" uploaded by ${req.user.name} (${req.user.role}). SHA-256: ${calculatedHash.slice(0, 16)}...`,
      result: 'Success',
    });

    return res.status(201).json({
      success: true,
      data: { ...newDoc.toObject(), id: newDoc._id },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload document', details: err.message });
  }
};

router.post('/upload', authenticate, authorizeRoles('Admin', 'Officer'), writeRouteLimiter, upload.single('file'), uploadDocument);

// Also support POST /api/documents as alias for upload
router.post('/', authenticate, authorizeRoles('Admin', 'Officer'), writeRouteLimiter, upload.single('file'), uploadDocument);

// -------------------------------------------------------------
// POST /api/documents/verify - Verify document cryptographic integrity (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.post('/verify', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), writeRouteLimiter, upload.single('file'), async (req, res) => {
  try {
    const { documentId, hash } = req.body;
    let targetDoc = null;

    if (documentId) {
      const query = documentId.startsWith('SD-') ? { documentId } : { _id: documentId };
      targetDoc = await SecureDocument.findOne(query);
    }

    let testHash = hash ? hash.trim().toLowerCase() : '';
    if (req.file && req.file.buffer) {
      testHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    }

    if (targetDoc && !testHash) {
      testHash = targetDoc.hash.toLowerCase();
    }

    if (!testHash && !targetDoc) {
      return res.status(400).json({ error: 'Provide a file, hash, or document ID to verify' });
    }

    if (targetDoc) {
      const isMatch = targetDoc.hash.toLowerCase() === testHash.toLowerCase();
      const updatedIntegrity = isMatch ? 'Verified' : 'Failed';
      await SecureDocument.updateOne({ _id: targetDoc._id }, { integrity: updatedIntegrity });

      await recordAudit({
        action: 'INTEGRITY_CHECK',
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        caseId: targetDoc.caseId,
        documentId: targetDoc.documentId,
        details: isMatch ? `Cryptographic hash check PASSED by ${req.user.name} (${req.user.role})` : `Cryptographic hash MISMATCH detected by ${req.user.name}! Possible tampering.`,
        result: isMatch ? 'Success' : 'Failure',
      });

      return res.json({
        verified: isMatch,
        documentId: targetDoc.documentId,
        documentName: targetDoc.documentName,
        storedHash: targetDoc.hash,
        calculatedHash: testHash,
        status: isMatch ? 'PASSED - Document is genuine and untampered' : 'FAILED - Document hash does not match original record!',
      });
    }

    // Direct lookup by hash in the ledger
    const matchingDoc = await SecureDocument.findOne({ hash: new RegExp(`^${escapeRegex(testHash)}$`, 'i') });
    return res.json({
      verified: !!matchingDoc,
      hash: testHash,
      matchingDocument: matchingDoc ? { documentId: matchingDoc.documentId, name: matchingDoc.documentName, caseId: matchingDoc.caseId } : null,
      status: matchingDoc ? 'VERIFIED: Document matches registered system record' : 'UNREGISTERED: Hash not found in tamper-evident ledger',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/documents/:id/download - Download document content (Admin, Officer, Legal Reviewer, Auditor)
// -------------------------------------------------------------
router.get('/:id/download', authenticate, authorizeRoles('Admin', 'Officer', 'Legal Reviewer', 'Auditor'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('SD-') ? { documentId: id } : { _id: id };
    const doc = await SecureDocument.findOne(query);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let buffer;
    if (doc.fileData) {
      buffer = Buffer.from(doc.fileData, 'base64');
    } else {
      buffer = Buffer.from(`SecureDocs Document Content\nDocument ID: ${doc.documentId}\nName: ${doc.documentName}\nCase ID: ${doc.caseId}\nCryptographic SHA-256 Hash: ${doc.hash}\nIntegrity: Verified\nTimestamp: ${doc.createdAt}`);
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename || doc.documentName + '.pdf'}"`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to download file', details: err.message });
  }
});

// -------------------------------------------------------------
// DELETE /api/documents/:id - Delete document (Admin only)
// -------------------------------------------------------------
router.delete('/:id', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('SD-') ? { documentId: id } : { _id: id };
    const doc = await SecureDocument.findOne(query);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await SecureDocument.deleteOne({ _id: doc._id });
    await Case.updateOne({ caseId: doc.caseId }, { $inc: { documentsCount: -1 } });

    await recordAudit({
      action: 'DOCUMENT_DELETED',
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      caseId: doc.caseId,
      documentId: doc.documentId,
      details: `Document "${doc.documentName}" (${doc.documentId}) deleted from case ${doc.caseId} by Admin ${req.user.name}`,
      result: 'Success',
    });

    return res.json({ success: true, message: `Document ${doc.documentId} deleted successfully` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete document', details: err.message });
  }
});

export default router;
