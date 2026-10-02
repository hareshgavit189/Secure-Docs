import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from './src/lib/db.js';
import { User } from './src/models/User.js';
import { Case } from './src/models/Case.js';
import { SecureDocument } from './src/models/Document.js';
import { AuditLog } from './src/models/AuditLog.js';

async function checkConnection() {
  console.log('Checking connection to MongoDB Atlas...');
  const start = Date.now();

  try {
    await connectDB();
    console.log(`Status: ${isDbConnected() ? 'ONLINE & CONNECTED' : 'DISCONNECTED'}`);
    console.log(`Latency: ${Date.now() - start} ms`);
    console.log(`Atlas cluster: ${mongoose.connection.host}`);
    console.log(`Database name: ${mongoose.connection.name}`);
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Cases: ${await Case.countDocuments()}`);
    console.log(`Documents: ${await SecureDocument.countDocuments()}`);
    console.log(`Audit logs: ${await AuditLog.countDocuments()}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkConnection();
