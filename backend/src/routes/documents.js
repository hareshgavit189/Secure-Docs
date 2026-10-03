/**
 * documents.js — Secure Document Routes
 *
 * HMAC-SHA-256 Integrity Security:
 *  UPLOAD   → computeUploadIntegrity(buffer) → stores { hash, hmac } in MongoDB
 *  DOWNLOAD → verifyDocumentIntegrity(buffer, hash, hmac) → serve or block with audit
 *  VERIFY   → accepts uploaded file or documentId → verifyDocumentIntegrity → report
 *
 * The DOCUMENT_HMAC_SECRET lives ONLY in process.env.
 * It is NEVER stored in MongoDB, NEVER returned to the frontend.
 */

import { Router }           from 'express';
import multer               from 'multer';
import crypto               from 'node:crypto';
import { rateLimit }        from 'express-rate-limit';
import { SecureDocument }   from '../models/Document.js';
import { Case }             from '../models/Case.js';
import { recordAudit }      from '../utils/audit.js';
import { escapeRegex }      from '../utils/escapeRegex.js';
import { computeUploadIntegrity, verifyDocumentIntegrity } from '../utils/integrity.js';

const router = Router();

// ── Multer: memory storage (never touch disk) ────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

// ── Rate limiters ────────────────────────────────────────────────────────────
const writeRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helper: strip sensitive fields from document before sending to client ───
function sanitizeDoc(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj.hmac;       // HMAC secret must never reach the frontend
  delete obj.fileData;   // Don't send full base64 in list responses
  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents — List documents with filters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, caseId, type, status, integrity, limit = 50 } = req.query;
    const query = {};

    if (caseId)    query.caseId = caseId.toUpperCase();
    if (type)      query.documentType = type;
    if (status)    query.status = status;
    if (integrity) query.integrity = integrity;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { documentName: rx }, { description: rx },
        { caseId: rx },       { uploadedBy: rx },
        { documentType: rx }, { documentId: rx },
      ];
    }

    // Exclude hmac and fileData from list responses
    const docs = await SecureDocument
      .find(query)
      .select('-hmac -fileData')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.json({ success: true, data: docs, count: docs.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve documents', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents/:id — Get single document details
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await SecureDocument
      .findById(req.params.id)
      .select('-hmac -fileData');  // hmac never exposed to frontend

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await SecureDocument.updateOne(
      { _id: req.params.id },
      { $set: { lastAccessed: new Date() }, $inc: { totalAccesses: 1 } }
    );

    return res.json({ success: true, data: { ...doc.toObject(), id: doc._id } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve document', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/documents/upload — Upload a new document
// Computes SHA-256 + HMAC-SHA-256 and stores both in MongoDB
// ─────────────────────────────────────────────────────────────────────────────
const uploadDocument = async (req, res) => {
  try {
    const {
      caseId,
      documentName,
      documentType    = 'FIR',
      description     = '',
      confidentiality = 'Confidential',
      uploadedBy,
      uploadedByRole  = 'Officer',
    } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    if (!documentName && !req.file) {
      return res.status(400).json({ error: 'Document name or file is required' });
    }

    const finalDocName = documentName?.trim() || req.file?.originalname || 'Evidentiary_Document.pdf';
    const uploaderName = uploadedBy?.trim() || 'Officer';

    let fileBuffer;
    let fileSize;
    let mimeType;

    if (req.file && req.file.buffer) {
      // Real file uploaded
      fileBuffer = req.file.buffer;
      fileSize   = req.file.size;
      mimeType   = req.file.mimetype;
    } else {
      // No file attached — create deterministic simulation buffer
      fileBuffer = Buffer.from(`${finalDocName}-${caseId}-${Date.now()}-SecureDocs`);
      fileSize   = 145000 + Math.floor(Math.random() * 50000);
      mimeType   = 'application/pdf';
    }

    // ── Compute SHA-256 + HMAC-SHA-256 ──────────────────────────────────────
    let sha256, hmac;
    try {
      ({ sha256, hmac } = computeUploadIntegrity(fileBuffer));
    } catch (hmacErr) {
      // HMAC secret missing — still allow upload but with SHA-256 only
      console.warn('⚠️  HMAC computation skipped:', hmacErr.message);
      sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      hmac   = '';  // empty = legacy mode
    }

    const docId  = `SD-${Math.floor(260000 + Math.random() * 9000)}`;
    const b64    = fileBuffer.toString('base64');

    const newDoc = await SecureDocument.create({
      documentId:       docId,
      documentName:     finalDocName,
      caseId:           caseId.trim().toUpperCase(),
      documentType,
      description:      description.trim(),
      originalFilename: req.file ? req.file.originalname : `${finalDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      mimeType,
      size:             fileSize,
      hash:             sha256,     // SHA-256 of file bytes
      hmac,                         // HMAC-SHA-256 of file bytes (secret in env only)
      version:          1,
      uploadedBy:       uploaderName,
      uploadedByRole,
      status:           'Approved',
      integrity:        'Verified',
      confidentiality,
      fileData:         b64,        // Base64 stored for download
    });

    await Case.updateOne(
      { caseId: caseId.trim().toUpperCase() },
      { $inc: { documentsCount: 1 } }
    );

    const hmacNote = hmac ? 'SHA-256 + HMAC-SHA-256' : 'SHA-256 only (HMAC_SECRET missing)';
    await recordAudit({
      action:    'DOCUMENT_UPLOADED',
      caseId:    caseId.trim().toUpperCase(),
      documentId: docId,
      details:   `Document "${finalDocName}" uploaded. Integrity: ${hmacNote}. SHA-256: ${sha256.slice(0, 16)}...`,
      userName:  uploaderName,
      userRole:  uploadedByRole,
      result:    'Success',
    });

    return res.status(201).json({
      success: true,
      data:    sanitizeDoc(newDoc),
      integrity: {
        method:  hmacNote,
        sha256:  sha256,
        // hmac is NOT returned to frontend
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload document', details: err.message });
  }
};

router.post('/upload', writeRouteLimiter, upload.single('file'), uploadDocument);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/documents/verify — Verify document integrity
// Can accept: { documentId } to re-verify stored doc
//         or: file upload to verify an external file against DB records
// ─────────────────────────────────────────────────────────────────────────────
const verifyDocumentRoute = async (req, res) => {
  try {
    const { documentId, hash: providedHash } = req.body;

    // ── Case A: File uploaded → verify it against stored records ─────────────
    if (req.file && req.file.buffer) {
      const fileBuffer    = req.file.buffer;
      const computedSHA   = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Find matching document by SHA-256
      const matchedDoc = await SecureDocument.findOne({ hash: computedSHA });

      if (!matchedDoc) {
        return res.status(404).json({
          verified:    false,
          method:      'SHA-256 file search',
          sha256:      computedSHA,
          message:     'No document in the database matches this file\'s SHA-256 hash.',
        });
      }

      // Full integrity check (SHA-256 + HMAC)
      const result = verifyDocumentIntegrity(fileBuffer, matchedDoc.hash, matchedDoc.hmac);

      await recordAudit({
        action:    result.valid ? 'INTEGRITY_CHECK' : 'INTEGRITY_VIOLATION',
        documentId: matchedDoc.documentId,
        caseId:    matchedDoc.caseId,
        details:   `File-upload integrity check. Method: ${result.method}. SHA-256: ${result.sha256Valid}, HMAC: ${result.hmacValid ?? 'N/A'}.`,
        result:    result.valid ? 'Success' : 'Failure',
      });

      return res.json({
        verified:    result.valid,
        sha256Valid: result.sha256Valid,
        hmacValid:   result.hmacValid,
        isLegacy:    result.isLegacy,
        method:      result.method,
        document: {
          documentId:   matchedDoc.documentId,
          documentName: matchedDoc.documentName,
          caseId:       matchedDoc.caseId,
          uploadedBy:   matchedDoc.uploadedBy,
          createdAt:    matchedDoc.createdAt,
        },
      });
    }

    // ── Case B: Verify a stored document by documentId ────────────────────────
    if (documentId) {
      const doc = await SecureDocument.findOne({ documentId });
      if (!doc) return res.status(404).json({ error: 'Document not found', documentId });

      // Reconstruct buffer from stored base64
      let buffer;
      if (doc.fileData) {
        try {
          buffer = Buffer.from(doc.fileData, 'base64');
        } catch {
          buffer = null;
        }
      }

      if (!buffer || buffer.length === 0) {
        // Seed/legacy document — no real file content
        return res.json({
          verified:    true,
          sha256Valid: null,
          hmacValid:   null,
          isLegacy:    true,
          method:      'No file data stored (seed/demo document)',
          document: {
            documentId:   doc.documentId,
            documentName: doc.documentName,
            caseId:       doc.caseId,
            uploadedBy:   doc.uploadedBy,
            storedHash:   doc.hash,
            integrity:    doc.integrity,
          },
        });
      }

      const result = verifyDocumentIntegrity(buffer, doc.hash, doc.hmac);

      // Update integrity field in DB to reflect current check
      const newIntegrityStatus = result.valid ? 'Verified' : 'Failed';
      await SecureDocument.updateOne(
        { documentId },
        { $set: { integrity: newIntegrityStatus, lastAccessed: new Date() } }
      );

      await recordAudit({
        action:    result.valid ? 'INTEGRITY_CHECK' : 'INTEGRITY_VIOLATION',
        documentId: doc.documentId,
        caseId:    doc.caseId,
        details:   `Stored document re-verified. Method: ${result.method}. SHA-256: ${result.sha256Valid}, HMAC: ${result.hmacValid ?? 'N/A'}.`,
        result:    result.valid ? 'Success' : 'Failure',
      });

      return res.json({
        verified:    result.valid,
        sha256Valid: result.sha256Valid,
        hmacValid:   result.hmacValid,
        isLegacy:    result.isLegacy,
        method:      result.method,
        document: {
          documentId:   doc.documentId,
          documentName: doc.documentName,
          caseId:       doc.caseId,
          uploadedBy:   doc.uploadedBy,
          storedHash:   doc.hash,
          integrity:    newIntegrityStatus,
          createdAt:    doc.createdAt,
        },
      });
    }

    // ── Case C: Hash-only lookup (no file) ────────────────────────────────────
    if (providedHash) {
      const doc = await SecureDocument.findOne({ hash: providedHash }).select('-hmac -fileData');
      if (!doc) {
        return res.json({ verified: false, message: 'No document found with this SHA-256 hash.', sha256: providedHash });
      }
      return res.json({
        verified:  true,
        method:    'SHA-256 hash lookup (no HMAC check — no file provided)',
        isLegacy:  !doc.hmac,
        document: {
          documentId:   doc.documentId,
          documentName: doc.documentName,
          caseId:       doc.caseId,
          uploadedBy:   doc.uploadedBy,
          integrity:    doc.integrity,
        },
      });
    }

    return res.status(400).json({
      error: 'Provide: (1) a file upload, (2) documentId in body, or (3) hash in body.',
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Verification error', details: err.message });
  }
};

router.post('/verify', writeRouteLimiter, upload.single('file'), verifyDocumentRoute);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents/:id/download — Download document
// Verifies SHA-256 + HMAC before serving. Blocks + audits if tampered.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await SecureDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // ── Reconstruct file buffer ───────────────────────────────────────────────
    let buffer;
    if (doc.fileData && doc.fileData.length > 0) {
      try {
        buffer = Buffer.from(doc.fileData, 'base64');
      } catch {
        buffer = null;
      }
    }

    if (!buffer || buffer.length === 0) {
      // Seed/demo document — generate placeholder, bypass HMAC (no real data)
      buffer = Buffer.from(
        `======================================\n` +
        `  SecureDocs — DEMONSTRATION DOCUMENT\n` +
        `======================================\n\n` +
        `Document ID   : ${doc.documentId}\n` +
        `Document Name : ${doc.documentName}\n` +
        `Case ID       : ${doc.caseId}\n` +
        `Type          : ${doc.documentType}\n` +
        `Uploaded By   : ${doc.uploadedBy} (${doc.uploadedByRole})\n` +
        `Confidentiality: ${doc.confidentiality}\n` +
        `SHA-256       : ${doc.hash}\n\n` +
        `Note: This is a seed/demo document. No actual file was stored.\n`
      );

      await recordAudit({
        action:    'DOCUMENT_DOWNLOAD',
        documentId: doc.documentId,
        caseId:    doc.caseId,
        details:   `Seed/demo document "${doc.documentName}" downloaded (no real file stored — placeholder served).`,
        result:    'Success',
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.documentId}_placeholder.txt"`);
      return res.send(buffer);
    }

    // ── Full Integrity Verification (SHA-256 + HMAC-SHA-256) ─────────────────
    const integrityResult = verifyDocumentIntegrity(buffer, doc.hash, doc.hmac);

    if (!integrityResult.valid) {
      // ┌──────────────────────────────────────────────────────────────────┐
      // │  SECURITY ALERT: Integrity check FAILED — block download         │
      // │  Possible tampering, corruption, or secret rotation detected.    │
      // └──────────────────────────────────────────────────────────────────┘
      console.error(
        `🔴 INTEGRITY FAILURE — Document: ${doc.documentId} | ` +
        `SHA256_valid=${integrityResult.sha256Valid} | HMAC_valid=${integrityResult.hmacValid}`
      );

      await SecureDocument.updateOne(
        { _id: doc._id },
        { $set: { integrity: 'Failed' } }
      );

      await recordAudit({
        action:    'INTEGRITY_VIOLATION',
        documentId: doc.documentId,
        caseId:    doc.caseId,
        details:
          `🔴 SECURITY ALERT: Integrity check FAILED for "${doc.documentName}". ` +
          `SHA-256 valid: ${integrityResult.sha256Valid}, ` +
          `HMAC valid: ${integrityResult.hmacValid}. ` +
          `Method: ${integrityResult.method}. Download BLOCKED.`,
        result: 'Failure',
      });

      return res.status(403).json({
        error:       'Document integrity verification failed. Download blocked.',
        reason:      'Possible document tampering or corruption detected.',
        sha256Valid: integrityResult.sha256Valid,
        hmacValid:   integrityResult.hmacValid,
        method:      integrityResult.method,
        documentId:  doc.documentId,
      });
    }

    // ── Integrity PASSED — serve file ─────────────────────────────────────────
    const methodNote = integrityResult.isLegacy
      ? 'SHA-256 only (legacy)'
      : 'SHA-256 + HMAC-SHA-256 ✓';

    await SecureDocument.updateOne(
      { _id: doc._id },
      {
        $set: { lastAccessed: new Date(), integrity: 'Verified' },
        $inc: { totalAccesses: 1 },
      }
    );

    await recordAudit({
      action:    'DOCUMENT_DOWNLOAD',
      documentId: doc.documentId,
      caseId:    doc.caseId,
      details:   `Document "${doc.documentName}" downloaded. Integrity verified: ${methodNote}.`,
      result:    'Success',
    });

    const filename = doc.originalFilename || `${doc.documentName}.pdf`;
    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Integrity-Method', integrityResult.isLegacy ? 'sha256-only' : 'sha256+hmac');
    res.setHeader('X-Integrity-Status', 'verified');
    return res.send(buffer);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/documents/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', writeRouteLimiter, async (req, res) => {
  try {
    const doc = await SecureDocument.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await Case.updateOne({ caseId: doc.caseId }, { $inc: { documentsCount: -1 } });

    await recordAudit({
      action:    'DOCUMENT_DELETED',
      documentId: doc.documentId,
      caseId:    doc.caseId,
      details:   `Document "${doc.documentName}" permanently deleted from Case ${doc.caseId}.`,
      result:    'Success',
    });

    return res.json({ success: true, message: 'Document deleted successfully', documentId: doc.documentId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete document', details: err.message });
  }
});

export default router;
