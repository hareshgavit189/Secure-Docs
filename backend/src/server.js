import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { config, validateEnv } from './config/env.js';
import authRoutes from './routes/auth.js';
import casesRoutes from './routes/cases.js';
import documentsRoutes from './routes/documents.js';
import auditRoutes from './routes/audit.js';
import dashboardRoutes from './routes/dashboard.js';
import { runSeed } from './seed.js';

// Validate env vars and print warnings at startup
validateEnv();

const app = express();

// ── Middlewares ────────────────────────────────────────
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Health Check ───────────────────────────────────────
app.get(['/api/health', '/health'], (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status:    isConnected ? 'ok' : 'degraded',
    database:  isConnected ? 'connected' : 'disconnected',
    dbHost:    mongoose.connection.host || null,
    dbName:    mongoose.connection.name || null,
    service:   'SecureDocs API (Node.js + MongoDB)',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/cases',     casesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/audit',     auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Global Error Handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start Server ───────────────────────────────────────
export async function startServer() {
  try {
    // 1. Connect to MongoDB (Atlas → Local fallback)
    await connectDB();

    // 2. Seed database if empty
    try {
      await runSeed(false);
    } catch (seedErr) {
      console.warn('⚠️ Seed initialization notice:', seedErr.message);
    }

    // 3. Start HTTP server
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`\n🚀 ===============================================`);
      console.log(`🛡️  SecureDocs API running on port ${config.port}`);
      console.log(`🔗 Local:   http://localhost:${config.port}`);
      console.log(`🔗 Health:  http://localhost:${config.port}/api/health`);
      console.log(`===============================================\n`);
    });

    // Configure server timeouts to prevent 5-minute socket drops on multi-GB uploads
    server.timeout = 0; // Disable idle timeout
    server.requestTimeout = 0; // Disable 5-min (300,000ms) request timeout in Node.js 18+
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 130000; // > keepAliveTimeout

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Auto-start when executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].includes('server.js'))) {
  startServer();
}

export default app;
