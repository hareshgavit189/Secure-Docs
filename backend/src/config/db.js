import dns from 'node:dns';
import mongoose from 'mongoose';

// Configure DNS for reliable Atlas SRV resolution
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

let connectionPromise = null;

/**
 * Connects to MongoDB — tries Atlas first, falls back to local Compass.
 * Environment variables:
 *   MONGODB_URI       → Atlas connection string (primary)
 *   MONGODB_LOCAL_URI → Local MongoDB URI (fallback, default: localhost:27017/securedocs)
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  const atlasUri    = process.env.MONGODB_URI || '';
  const localUri    = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/securedocs';

  // Build ordered list: Atlas first (if set), local always as fallback
  const uriQueue = [];
  if (atlasUri) uriQueue.push({ uri: atlasUri, label: '🌐 MongoDB Atlas' });
  uriQueue.push({ uri: localUri, label: '🖥️  MongoDB Local Compass' });

  connectionPromise = (async () => {
    for (const { uri, label } of uriQueue) {
      try {
        console.log(`⏳ Connecting to ${label}...`);
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 8000,
          dbName: 'securedocs',          // always use securedocs, never 'test'
        });
        console.log(`✅ ${label} connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      } catch (err) {
        console.warn(`⚠️  ${label} connection failed: ${err.message}`);
        // If more URIs remain, try next
        const isLast = uri === uriQueue[uriQueue.length - 1].uri;
        if (isLast) {
          connectionPromise = null;
          throw new Error(`❌ All MongoDB connections failed. Last error: ${err.message}`);
        }
        console.log('🔄 Trying fallback connection...');
      }
    }
  })();

  return connectionPromise;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDbInfo() {
  return {
    connected: isDbConnected(),
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
  };
}
