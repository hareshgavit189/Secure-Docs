import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'Officer',
    },
    caseId: {
      type: String,
      default: '',
    },
    documentId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    previousHash: {
      type: String,
      default: null,
    },
    eventHash: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ['Success', 'Warning', 'Failure'],
      default: 'Success',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
