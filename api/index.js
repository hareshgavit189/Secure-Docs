import app from '../backend/src/server.js';
import { connectDB } from '../backend/src/config/db.js';

/**
 * Vercel Serverless Function Handler
 * Connects to MongoDB (Atlas first, local fallback) then passes request to Express.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB serverless connection error:', err.message);
    // Continue anyway — Express will return appropriate error responses
  }
  return app(req, res);
}
