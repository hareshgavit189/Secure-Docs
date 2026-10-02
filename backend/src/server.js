import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.js';
import casesRoutes from './routes/cases.js';
import documentsRoutes from './routes/documents.js';
import auditRoutes from './routes/audit.js';
import dashboardRoutes from './routes/dashboard.js';
import { runSeed } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SecureDocs Full-Stack Backend (Pure Node.js + MongoDB)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    // Auto-seed if database is empty
    await runSeed(false);
  } catch (err) {
    console.warn('DB initialization notice:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ===============================================`);
    console.log(`🛡️  SecureDocs API Server running on port ${PORT}`);
    console.log(`🔗 Local URL:   http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================\n`);
  });
}

startServer();

export default app;
