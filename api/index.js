import app from '../backend/src/server.js';
import { connectDB } from '../backend/src/lib/db.js';

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
