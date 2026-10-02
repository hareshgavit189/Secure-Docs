import dns from 'node:dns';
import mongoose from 'mongoose';

// Configure DNS resolver for reliable SRV record resolution across various network environments
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore DNS configuration errors in environments where setServers is restricted
}

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg = '❌ MongoDB connection error: MONGODB_URI environment variable is not defined in .env';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB Atlas connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return mongoose.connection;
    } catch (err) {
      connectionPromise = null;
      console.error(`❌ MongoDB connection failed: ${err.message}`);
      throw err;
    }
  })();

  return connectionPromise;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
