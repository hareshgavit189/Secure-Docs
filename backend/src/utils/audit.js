import crypto from 'node:crypto';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Records a cryptographically chained audit log entry.
 * Each entry stores the previous entry's hash, forming a tamper-evident chain.
 */
export async function recordAudit({
  action,
  userId       = '',
  userName     = 'System',
  userRole     = 'Officer',
  caseId       = '',
  documentId   = '',
  details      = '',
  result       = 'Success',
  ipAddress    = '127.0.0.1',
}) {
  try {
    const lastAudit    = await AuditLog.findOne().sort({ timestamp: -1, _id: -1 }).lean();
    const previousHash = lastAudit
      ? (lastAudit.eventHash || 'GENESIS')
      : 'GENESIS_BLOCK_0000000000000000';

    const payload   = `${action}:${caseId}:${documentId}:${userName}:${Date.now()}:${previousHash}`;
    const eventHash = crypto.createHash('sha256').update(payload).digest('hex');

    const logEntry  = await AuditLog.create({
      action,
      userId,
      userName,
      userRole,
      caseId,
      documentId,
      details,
      previousHash,
      eventHash,
      result,
      ipAddress,
      timestamp: new Date(),
    });

    return logEntry;
  } catch (err) {
    console.warn('⚠️ Audit recording warning (non-fatal):', err.message);
    return null;
  }
}
