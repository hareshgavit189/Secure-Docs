import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      default: () => `SD-${Math.floor(260000 + Math.random() * 9000)}`,
      unique: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    caseId: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['FIR', 'Forensic Report', 'Witness Statement', 'Charge Sheet', 'Court Order', 'Legal Review', 'Medical Evidence', 'Other'],
      default: 'FIR',
    },
    description: {
      type: String,
      default: '',
    },
    originalFilename: {
      type: String,
      default: 'evidence.pdf',
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    size: {
      type: Number,
      default: 0,
    },
    hash: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    uploadedBy: {
      type: String,
      required: true,
      default: 'Officer Raj Patel',
    },
    uploadedByRole: {
      type: String,
      default: 'Officer',
    },
    status: {
      type: String,
      enum: ['Pending Review', 'Approved', 'Rejected', 'Flagged'],
      default: 'Approved',
    },
    integrity: {
      type: String,
      enum: ['Verified', 'Warning', 'Failed'],
      default: 'Verified',
    },
    confidentiality: {
      type: String,
      enum: ['Public/Internal', 'Confidential', 'Restricted', 'Highly Restricted'],
      default: 'Confidential',
    },
    fileData: {
      type: String, // Base64 encoded or content for demo download
      default: '',
    },
    totalAccesses: {
      type: Number,
      default: 1,
    },
    lastAccessedBy: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const SecureDocument = mongoose.models.SecureDocument || mongoose.model('SecureDocument', documentSchema);
