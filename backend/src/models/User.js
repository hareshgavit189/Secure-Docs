import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Officer', 'Legal Reviewer', 'Clerk', 'Auditor'],
      default: 'Officer',
    },
    department: {
      type: String,
      required: true,
      default: 'Investigation',
    },
    employeeId: {
      type: String,
      default: () => `EMP-${Math.floor(100 + Math.random() * 900)}`,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
