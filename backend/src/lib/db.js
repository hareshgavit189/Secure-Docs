import dns from 'node:dns';
import mongoose from 'mongoose';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not configured');
  }

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  }).then((connection) => {
    console.log(`MongoDB Atlas connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  }).catch((error) => {
    connectionPromise = null;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  });

  return connectionPromise;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
