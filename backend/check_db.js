import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from './src/lib/db.js';
import { User } from './src/models/User.js';
import { Case } from './src/models/Case.js';
import { SecureDocument } from './src/models/Document.js';
import { AuditLog } from './src/models/AuditLog.js';

async function checkConnection() {
  console.log('🔄 Checking connection to MongoDB Atlas...');
  const start = Date.now();
  
  try {
    await connectDB();
    const duration = Date.now() - start;

    console.log('\n======================================================');
    console.log('🛡️  SECUREDOCS DATABASE CONNECTION DIAGNOSTIC');
    console.log('======================================================');
    console.log(`✅ Status:           ${isDbConnected() ? 'ONLINE & CONNECTED' : 'DISCONNECTED'}`);
    console.log(`⏱️ Latency:          ${duration} ms`);
    console.log(`🌐 Atlas Cluster:    ${mongoose.connection.host}`);
    console.log(`📁 Database Name:    ${mongoose.connection.name}`);
    console.log(`🔌 ReadyState:       ${mongoose.connection.readyState} (1 = connected)`);
    console.log('------------------------------------------------------');
    console.log('📊 LIVE ATLAS DATA COUNTS:');
    console.log(`   👥 Users:         ${await User.countDocuments()}`);
    console.log(`   📂 Cases:         ${await Case.countDocuments()}`);
    console.log(`   📄 Documents:     ${await SecureDocument.countDocuments()}`);
    console.log(`   📜 Audit Logs:    ${await AuditLog.countDocuments()}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error(`\n❌ MongoDB Connection Error: ${err.message}\n`);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkConnection();
