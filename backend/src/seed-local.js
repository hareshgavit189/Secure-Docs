/**
 * seed-local.js
 * Seeds the LOCAL MongoDB Compass (localhost:27017/securedocs) directly,
 * regardless of what MONGODB_URI is set to in .env.
 * Run with: node src/seed-local.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Case } from './models/Case.js';
import { SecureDocument } from './models/Document.js';
import { AuditLog } from './models/AuditLog.js';

const LOCAL_URI = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/securedocs';

async function seedLocal() {
  console.log('\n🖥️  Connecting to LOCAL MongoDB Compass...');
  try {
    await mongoose.connect(LOCAL_URI, {
      serverSelectionTimeoutMS: 6000,
      dbName: 'securedocs',
    });
    console.log(`✅ Local MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}\n`);
  } catch (err) {
    console.error('❌ Cannot connect to local MongoDB. Is MongoDB running on your PC?');
    console.error('   Start MongoDB: open MongoDB Compass or run "mongod" in terminal');
    console.error('   Error:', err.message);
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  const caseCount = await Case.countDocuments();
  if (caseCount > 0 && !force) {
    console.log(`ℹ️  Local DB already has ${caseCount} cases. Use --force to re-seed.`);
    await mongoose.disconnect();
    return;
  }

  console.log('🌱 Seeding LOCAL MongoDB Compass with all data...\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@securedocs.gov',     name: 'Admin Officer',        role: 'Admin',          department: 'Administration',     employeeId: 'ADM-001', passwordHash, isActive: true },
    { email: 'raj.patel@securedocs.gov', name: 'Officer Raj Patel',    role: 'Officer',        department: 'Investigation',      employeeId: 'OFF-001', passwordHash, isActive: true },
    { email: 'amit.shah@securedocs.gov', name: 'Officer Amit Shah',    role: 'Officer',        department: 'Cyber Crime',        employeeId: 'OFF-002', passwordHash, isActive: true },
    { email: 'mehta@securedocs.gov',     name: 'Legal Counsel Mehta',  role: 'Legal Reviewer', department: 'Legal Department',   employeeId: 'LEG-001', passwordHash, isActive: true },
    { email: 'auditor@securedocs.gov',   name: 'Auditor Verma',        role: 'Auditor',        department: 'Compliance & Audit', employeeId: 'AUD-001', passwordHash, isActive: true },
    { email: 'clerk@securedocs.gov',     name: 'Clerk Sharma',         role: 'Clerk',          department: 'Records',            employeeId: 'CLK-001', passwordHash, isActive: true },
  ];
  for (const u of users) {
    await User.findOneAndUpdate({ email: u.email }, { $set: u }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`   ✅ ${users.length} users seeded  (password: password123)`);

  // ── 2. Cases ──────────────────────────────────────────────────────────────
  const cases = [
    { caseId: 'C-1024', title: 'Operation Blue Shield (Financial Fraud)',       type: 'Financial Crime',  description: 'Multi-crore offshore shell company money laundering investigation.',     department: 'Financial Crime',   assignedOfficer: 'Officer Raj Patel',   priority: 'High',   status: 'Active',              risk: 'High',   confidentiality: 'Highly Restricted', createdBy: 'Admin Officer',      documentsCount: 2 },
    { caseId: 'C-1025', title: 'Central Registry Document Forgery',              type: 'Investigation',    description: 'Forensic analysis of counterfeit municipal deed registrations.',        department: 'Investigation',     assignedOfficer: 'Officer Amit Shah',   priority: 'Medium', status: 'Under Investigation', risk: 'Medium', confidentiality: 'Confidential',      createdBy: 'Officer Raj Patel',  documentsCount: 1 },
    { caseId: 'C-1026', title: 'Critical Infrastructure Cyber Intrusion',        type: 'Cyber Crime',      description: 'Zero-day attack logs analysis on supervisory control network.',         department: 'Cyber Crime',       assignedOfficer: 'Officer Amit Shah',   priority: 'High',   status: 'Active',              risk: 'High',   confidentiality: 'Highly Restricted', createdBy: 'Admin Officer',      documentsCount: 1 },
    { caseId: 'C-1027', title: 'State Revenue Audit Discrepancies',              type: 'Legal Department', description: 'Discrepancy review between excise declarations and commercial port logs.',department: 'Legal Department',  assignedOfficer: 'Legal Counsel Mehta', priority: 'Low',    status: 'Under Review',        risk: 'Low',    confidentiality: 'Restricted',        createdBy: 'Clerk Sharma',       documentsCount: 1 },
    { caseId: 'C-1028', title: 'Special Witness Protection File',                type: 'Investigation',    description: 'Deposition audio transcripts and biometric identity validation.',        department: 'Investigation',     assignedOfficer: 'Officer Raj Patel',   priority: 'High',   status: 'Active',              risk: 'High',   confidentiality: 'Highly Restricted', createdBy: 'Admin Officer',      documentsCount: 0 },
  ];
  for (const c of cases) {
    await Case.findOneAndUpdate({ caseId: c.caseId }, { $set: c }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`   ✅ ${cases.length} cases seeded`);

  // ── 3. Documents ──────────────────────────────────────────────────────────
  const docs = [
    { documentId: 'SD-260101', documentName: 'FIR_1024_Certified.pdf',                  caseId: 'C-1024', documentType: 'FIR',              description: 'FIR lodged under Section 420 IPC with magistrate stamp.',                       originalFilename: 'fir_1024_certified.pdf',    mimeType: 'application/pdf', size: 245120,  hash: 'a3f7c2e8b91d4056e9c4039df8a215b497c2e11894b9015c71d28394af3910c2', uploadedBy: 'Officer Raj Patel',   uploadedByRole: 'Officer',        status: 'Approved', integrity: 'Verified', confidentiality: 'Highly Restricted' },
    { documentId: 'SD-260102', documentName: 'Forensic_Financial_Audit_2026.pdf',        caseId: 'C-1024', documentType: 'Forensic Report',  description: 'Certified chartered forensic ledger reconciliation tracing transaction flows.', originalFilename: 'forensic_financial_audit.pdf', mimeType: 'application/pdf', size: 1420500, hash: 'b8c3d7e2f9a14583840294819402914081940291840291401948201948019284',  uploadedBy: 'Auditor Verma',       uploadedByRole: 'Auditor',        status: 'Approved', integrity: 'Verified', confidentiality: 'Confidential' },
    { documentId: 'SD-260103', documentName: 'Seized_Deed_Registry_Scan.pdf',            caseId: 'C-1025', documentType: 'Witness Statement', description: 'High-resolution scan of forged land deed with handwriting analysis.',          originalFilename: 'seized_deed_scan.pdf',      mimeType: 'application/pdf', size: 890400,  hash: 'd4e9f1a7c3b5206884a1e948c279401f849b2801948271049c81940bca910482',  uploadedBy: 'Officer Amit Shah',   uploadedByRole: 'Officer',        status: 'Approved', integrity: 'Verified', confidentiality: 'Confidential' },
    { documentId: 'SD-260104', documentName: 'Cyber_Forensics_Firewall_Packet_Dump.pdf', caseId: 'C-1026', documentType: 'Forensic Report',  description: 'Packet capture showing unauthorized root certificate installation.',           originalFilename: 'pcap_analysis_report.pdf',  mimeType: 'application/pdf', size: 3200150, hash: 'e5a1b2c3d4f567890123456789abcdef0123456789abcdef0123456789abcdef',  uploadedBy: 'Officer Amit Shah',   uploadedByRole: 'Officer',        status: 'Approved', integrity: 'Verified', confidentiality: 'Highly Restricted' },
    { documentId: 'SD-260105', documentName: 'Magistrate_Interim_Injunction_Order.pdf',  caseId: 'C-1027', documentType: 'Court Order',      description: 'Court order directing freeze of connected corporate accounts pending trial.',   originalFilename: 'interim_order.pdf',         mimeType: 'application/pdf', size: 412000,  hash: 'f9c8b7a6543210feebda9876543210fedcba9876543210fedcba9876543210fe',  uploadedBy: 'Legal Counsel Mehta', uploadedByRole: 'Legal Reviewer', status: 'Approved', integrity: 'Verified', confidentiality: 'Restricted' },
  ];
  for (const d of docs) {
    await SecureDocument.findOneAndUpdate({ documentId: d.documentId }, { $set: d }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`   ✅ ${docs.length} documents seeded`);

  // ── 4. Audit Chain ────────────────────────────────────────────────────────
  await AuditLog.deleteMany({});   // clear old ones before re-seeding chain
  const auditEntries = [
    { action: 'SYSTEM_GENESIS',    userName: 'SecureDocs Kernel',   userRole: 'System',  details: 'SecureDocs Cryptographic Ledger Genesis Initialized', previousHash: 'GENESIS_BLOCK_0000000000000000', eventHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', result: 'Success', timestamp: new Date(Date.now() - 86400000) },
    { action: 'CASE_CREATED',      caseId: 'C-1024', userName: 'Admin Officer',      userRole: 'Admin',   details: 'Registered Case C-1024: Operation Blue Shield',                          previousHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', eventHash: '7a12b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', result: 'Success', timestamp: new Date(Date.now() - 72000000) },
    { action: 'DOCUMENT_UPLOADED', caseId: 'C-1024', documentId: 'SD-260101', userName: 'Officer Raj Patel', userRole: 'Officer', details: 'Uploaded FIR_1024_Certified.pdf with SHA-256 validation',    previousHash: '7a12b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', eventHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', result: 'Success', timestamp: new Date(Date.now() - 54000000) },
    { action: 'INTEGRITY_CHECK',   caseId: 'C-1024', documentId: 'SD-260101', userName: 'Auditor Verma',    userRole: 'Auditor', details: 'Cryptographic SHA-256 hash verified against immutable ledger: MATCHED', previousHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', eventHash: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', result: 'Success', timestamp: new Date(Date.now() - 18000000) },
  ];
  for (const a of auditEntries) {
    await AuditLog.create(a);
  }
  console.log(`   ✅ ${auditEntries.length} audit chain blocks seeded`);

  await mongoose.disconnect();
  console.log('\n🎉 LOCAL MongoDB Compass seeding complete!');
  console.log('📌 Database: securedocs  |  Host: localhost:27017\n');
}

seedLocal().catch((err) => {
  console.error('❌ Local seed error:', err.message);
  process.exit(1);
});
