import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: 'Investigation',
    },
    description: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      required: true,
      default: 'Investigation',
    },
    assignedOfficer: {
      type: String,
      required: true,
      default: 'Officer Raj Patel',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Active', 'Under Investigation', 'Under Review', 'Closed', 'Archived'],
      default: 'Active',
    },
    risk: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    confidentiality: {
      type: String,
      enum: ['Public/Internal', 'Confidential', 'Restricted', 'Highly Restricted'],
      default: 'Confidential',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    documentsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: 'Admin User',
    },
  },
  { timestamps: true }
);

export const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
