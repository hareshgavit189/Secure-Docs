import app from '../backend/src/server.js';
import { connectDB } from '../backend/src/lib/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB serverless connection error:', err);
  }
  return app(req, res);
}
