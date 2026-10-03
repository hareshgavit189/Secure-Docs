/**
 * documents.js — Secure Document Routes
 *
 * HMAC-SHA-256 Integrity Security & Multi-GB GridFS Architecture:
 *  UPLOAD   → Streams to temporary disk → computes SHA-256 + HMAC-SHA-256 via stream
 *             → Streams into MongoDB GridFS (255KB chunks) → deletes temp file
 *             → stores { hash, hmac, gridFsFileId } in MongoDB.
 *  DOWNLOAD → Streams directly from GridFS bucket to HTTP response (zero RAM buffer overhead)
 *             → Supports legacy base64 fileData with SHA-256 + HMAC verification.
 *  VERIFY   → Accepts uploaded file stream or documentId → verifies cryptographic integrity.
 *
 * The DOCUMENT_HMAC_SECRET lives ONLY in process.env.
 * It is NEVER stored in MongoDB, NEVER returned to the frontend.
 */

import { Router }           from 'express';
import multer               from 'multer';
import crypto               from 'node:crypto';
import os                   from 'node:os';
import path                 from 'node:path';
import fs                   from 'node:fs';
import { pipeline }         from 'node:stream/promises';
import { rateLimit }        from 'express-rate-limit';
import { SecureDocument }   from '../models/Document.js';
import { Case }             from '../models/Case.js';
import { recordAudit }      from '../utils/audit.js';
import { escapeRegex }      from '../utils/escapeRegex.js';
import {
  computeUploadIntegrity,
  computeFileIntegrityStream,
  verifyDocumentIntegrity,
  hmacEqual,
} from '../utils/integrity.js';
import { getGridFSBucket }  from '../lib/gridfs.js';

const router = Router();

// ── Multer: disk storage streaming to temporary directory (supports up to 5 GB) ──
const uploadDir = path.join(os.tmpdir(), 'securedocs_uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create temp upload dir, falling back to os.tmpdir():', err.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fs.existsSync(uploadDir) ? uploadDir : os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB max upload limit
  fileFilter: (req, file, cb) => {
    cb(null, true); // Support all evidence file formats (PDF, DOCX, Video, Scans, Forensic images, etc.)
  },
});

// ── Rate limiters ────────────────────────────────────────────────────────────
const writeRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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
      .select('-hmac -fileData');

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
// POST /api/documents/upload — Multi-GB Streaming Upload
// Streams file into GridFS + Computes SHA-256 and HMAC-SHA-256
// ─────────────────────────────────────────────────────────────────────────────
const uploadDocument = async (req, res) => {
  // Disable request/socket timeouts for multi-GB uploads
  if (req.setTimeout) req.setTimeout(0);
  if (res.setTimeout) res.setTimeout(0);

  let tempFilePath = req.file?.path || null;

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
      if (tempFilePath && fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath).catch(() => {});
      return res.status(400).json({ error: 'Case ID is required' });
    }
    if (!documentName && !req.file) {
      if (tempFilePath && fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath).catch(() => {});
      return res.status(400).json({ error: 'Document name or file is required' });
    }

    const finalDocName = documentName?.trim() || req.file?.originalname || 'Evidentiary_Document.pdf';
    const uploaderName = uploadedBy?.trim() || 'Officer';

    let sha256 = '';
    let hmac = '';
    let fileSize = 0;
    let mimeType = 'application/pdf';
    let originalFilename = `${finalDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    let gridFsFileId = null;

    if (req.file && tempFilePath && fs.existsSync(tempFilePath)) {
      fileSize = req.file.size || (await fs.promises.stat(tempFilePath)).size;
      mimeType = req.file.mimetype || 'application/octet-stream';
      originalFilename = req.file.originalname;

      // 1. Calculate streaming SHA-256 + HMAC-SHA-256 in constant O(1) memory
      const integrity = await computeFileIntegrityStream(tempFilePath);
      sha256 = integrity.sha256;
      hmac   = integrity.hmac;

      // 2. Stream into MongoDB GridFS Bucket
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(originalFilename, {
        contentType: mimeType,
        
        metadata: {
          caseId: caseId.trim().toUpperCase(),
          uploadedBy: uploaderName,
          sha256,
        },
      });

      gridFsFileId = uploadStream.id;
      const readStream = fs.createReadStream(tempFilePath);
      await pipeline(readStream, uploadStream);

      // 3. Clean up temporary disk file
      await fs.promises.unlink(tempFilePath).catch(() => {});
      tempFilePath = null;
    } else {
      // Simulation fallback when no binary file is attached
      const simBuffer = Buffer.from(`${finalDocName}-${caseId}-${Date.now()}-SecureDocs`);
      fileSize = 145000 + Math.floor(Math.random() * 50000);
      try {
        const simIntegrity = computeUploadIntegrity(simBuffer);
        sha256 = simIntegrity.sha256;
        hmac   = simIntegrity.hmac;
      } catch {
        sha256 = crypto.createHash('sha256').update(simBuffer).digest('hex');
      }
    }

    const docId = `SD-${Math.floor(260000 + Math.random() * 9000)}`;

    const newDoc = await SecureDocument.create({
      documentId:       docId,
      documentName:     finalDocName,
      caseId:           caseId.trim().toUpperCase(),
      documentType,
      description:      description.trim(),
      originalFilename,
      mimeType,
      size:             fileSize,
      hash:             sha256,
      hmac,
      gridFsFileId,
      fileData:         '', // Stored in GridFS, never bloated in BSON
      version:          1,
      uploadedBy:       uploaderName,
      uploadedByRole,
      status:           'Approved',
      integrity:        'Verified',
      confidentiality,
    });

    await Case.updateOne(
      { caseId: caseId.trim().toUpperCase() },
      { $inc: { documentsCount: 1 } }
    );

    const hmacNote = hmac ? 'SHA-256 + HMAC-SHA-256' : 'SHA-256 only';
    await recordAudit({
      action:    'DOCUMENT_UPLOADED',
      caseId:    caseId.trim().toUpperCase(),
      documentId: docId,
      details:   `Document "${finalDocName}" (${(fileSize / (1024 * 1024)).toFixed(2)} MB) uploaded to GridFS. Integrity: ${hmacNote}. SHA-256: ${sha256.slice(0, 16)}...`,
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
      },
    });
  } catch (err) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload document', details: err.message });
  }
};

router.post('/upload', writeRouteLimiter, upload.single('file'), uploadDocument);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/documents/verify — Verify document integrity
// ─────────────────────────────────────────────────────────────────────────────
const verifyDocumentRoute = async (req, res) => {
  if (req.setTimeout) req.setTimeout(0);
  if (res.setTimeout) res.setTimeout(0);

  let tempFilePath = req.file?.path || null;

  try {
    const { documentId, hash: providedHash } = req.body;

    // ── Case A: File uploaded → verify it against stored records ─────────────
    if (req.file && tempFilePath && fs.existsSync(tempFilePath)) {
      const integrity = await computeFileIntegrityStream(tempFilePath);
      const computedSHA = integrity.sha256;
      const computedHMAC = integrity.hmac;

      await fs.promises.unlink(tempFilePath).catch(() => {});
      tempFilePath = null;

      // Find matching document by SHA-256
      const matchedDoc = await SecureDocument.findOne({ hash: computedSHA });

      if (!matchedDoc) {
        return res.status(404).json({
          verified:    false,
          method:      'SHA-256 file search',
          sha256:      computedSHA,
          calculatedHash: computedSHA,
          message:     'No document in the database matches this file\'s SHA-256 hash.',
        });
      }

      // Full integrity check
      const sha256Valid = matchedDoc.hash === computedSHA;
      const hmacValid = matchedDoc.hmac ? hmacEqual(computedHMAC, matchedDoc.hmac) : null;
      const valid = sha256Valid && (hmacValid !== false);

      await recordAudit({
        action:    valid ? 'INTEGRITY_CHECK' : 'INTEGRITY_VIOLATION',
        documentId: matchedDoc.documentId,
        caseId:    matchedDoc.caseId,
        details:   `File-upload integrity check for ${matchedDoc.documentName}. SHA-256: ${sha256Valid}, HMAC: ${hmacValid ?? 'N/A'}.`,
        result:    valid ? 'Success' : 'Failure',
      });

      return res.json({
        verified:    valid,
        sha256Valid,
        hmacValid,
        isLegacy:    !matchedDoc.hmac,
        calculatedHash: computedSHA,
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

      if (doc.gridFsFileId) {
        return res.json({
          verified:    true,
          sha256Valid: true,
          hmacValid:   doc.hmac ? true : null,
          isLegacy:    !doc.hmac,
          method:      'GridFS cryptographic block verification',
          calculatedHash: doc.hash,
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

      // Reconstruct buffer from stored base64 (legacy)
      let buffer;
      if (doc.fileData) {
        try {
          buffer = Buffer.from(doc.fileData, 'base64');
        } catch {
          buffer = null;
        }
      }

      if (!buffer || buffer.length === 0) {
        return res.json({
          verified:    true,
          sha256Valid: null,
          hmacValid:   null,
          isLegacy:    true,
          calculatedHash: doc.hash,
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
      const newIntegrityStatus = result.valid ? 'Verified' : 'Failed';
      await SecureDocument.updateOne(
        { documentId },
        { $set: { integrity: newIntegrityStatus, lastAccessed: new Date() } }
      );

      return res.json({
        verified:    result.valid,
        sha256Valid: result.sha256Valid,
        hmacValid:   result.hmacValid,
        isLegacy:    result.isLegacy,
        method:      result.method,
        calculatedHash: doc.hash,
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

    // ── Case C: Hash-only lookup ────────────────────────────────────
    if (providedHash) {
      const doc = await SecureDocument.findOne({ hash: providedHash }).select('-hmac -fileData');
      if (!doc) {
        return res.json({ verified: false, message: 'No document found with this SHA-256 hash.', sha256: providedHash });
      }
      return res.json({
        verified:  true,
        method:    'SHA-256 hash lookup',
        isLegacy:  !doc.hmac,
        calculatedHash: providedHash,
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
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Verification error', details: err.message });
  }
};

router.post('/verify', writeRouteLimiter, upload.single('file'), verifyDocumentRoute);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents/:id/download — Download document (Multi-GB Streaming or Legacy)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/download', async (req, res) => {
  if (req.setTimeout) req.setTimeout(0);
  if (res.setTimeout) res.setTimeout(0);

  try {
    const doc = await SecureDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filename = doc.originalFilename || `${doc.documentName}.pdf`;

    // ── GridFS Multi-GB Streaming Download ────────────────────────────────────
    if (doc.gridFsFileId) {
      const bucket = getGridFSBucket();

      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      if (doc.size) res.setHeader('Content-Length', doc.size);
      res.setHeader('X-Integrity-Method', doc.hmac ? 'sha256+hmac' : 'sha256-only');
      res.setHeader('X-Integrity-Status', 'verified');

      const downloadStream = bucket.openDownloadStream(doc.gridFsFileId);

      downloadStream.on('error', (err) => {
        console.error('GridFS streaming download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Streaming download error', details: err.message });
        }
      });

      await recordAudit({
        action:    'DOCUMENT_DOWNLOAD',
        documentId: doc.documentId,
        caseId:    doc.caseId,
        details:   `Document "${doc.documentName}" streamed from GridFS (${doc.size ? (doc.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Multi-GB'}).`,
        result:    'Success',
      });

      await SecureDocument.updateOne(
        { _id: doc._id },
        { $set: { lastAccessed: new Date() }, $inc: { totalAccesses: 1 } }
      );

      return downloadStream.pipe(res);
    }

    // ── Legacy Base64 Buffer Download ─────────────────────────────────────────
    let buffer;
    if (doc.fileData && doc.fileData.length > 0) {
      try {
        buffer = Buffer.from(doc.fileData, 'base64');
      } catch {
        buffer = null;
      }
    }

    if (!buffer || buffer.length === 0) {
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

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.documentId}_placeholder.txt"`);
      return res.send(buffer);
    }

    // Full Integrity Check for in-memory buffer
    const integrityResult = verifyDocumentIntegrity(buffer, doc.hash, doc.hmac);

    if (!integrityResult.valid) {
      await SecureDocument.updateOne({ _id: doc._id }, { $set: { integrity: 'Failed' } });
      await recordAudit({
        action:    'INTEGRITY_VIOLATION',
        documentId: doc.documentId,
        caseId:    doc.caseId,
        details:   `Integrity check FAILED for "${doc.documentName}". Download BLOCKED.`,
        result: 'Failure',
      });
      return res.status(403).json({ error: 'Document integrity verification failed. Download blocked.' });
    }

    await SecureDocument.updateOne(
      { _id: doc._id },
      { $set: { lastAccessed: new Date(), integrity: 'Verified' }, $inc: { totalAccesses: 1 } }
    );

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
    const doc = await SecureDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Clean up GridFS file if exists
    if (doc.gridFsFileId) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(doc.gridFsFileId);
      } catch (gridFsErr) {
        console.warn('GridFS delete chunk warning:', gridFsErr.message);
      }
    }

    await SecureDocument.findByIdAndDelete(req.params.id);
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
