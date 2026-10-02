import dns from 'node:dns';
import mongoose from 'mongoose';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const FALLBACK_ATLAS_URI =
  'mongodb+srv://Harsh__1111admin:Harsh2007@sih.9ut1ht1.mongodb.net/securedocs?retryWrites=true&w=majority&appName=SIH';

let isConnected = false;
let memServer = null;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || FALLBACK_ATLAS_URI;
  
  // 1. Try configured URI
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️ Remote MongoDB connection failed (${err.message}).`);
  }

  // 2. Try Localhost standard port 27017
  try {
    console.log('🔄 Attempting local MongoDB on mongodb://127.0.0.1:27017/securedocs...');
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/securedocs', { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (errLocal) {
    console.warn('⚠️ Local MongoDB not available.');
  }

  // 3. Fallback to automated in-memory MongoDB for offline/hackathon resilience
  try {
    console.log('⚡ Starting embedded MongoDB engine (mongodb-memory-server) for zero-downtime demo...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create({
      instance: { dbName: 'securedocs' }
    });
    const memoryUri = memServer.getUri();
    process.env.MONGODB_URI = memoryUri;
    const conn = await mongoose.connect(memoryUri);
    isConnected = true;
    console.log(`✅ Embedded MongoDB engine running at ${memoryUri}`);
    return conn;
  } catch (errMem) {
    console.error(`❌ All MongoDB connection strategies failed: ${errMem.message}`);
    return null;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
