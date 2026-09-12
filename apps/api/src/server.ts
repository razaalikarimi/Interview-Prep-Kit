import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRouter } from './controllers/auth.controller.js';
import { kitRouter } from './controllers/kit.controller.js';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDatabase } from './infrastructure/database/connection.js';
import { logger } from './utils/logger.js';

// ============================================================
// EXPRESS APPLICATION SETUP
// ============================================================

const app = express();

const isDev = process.env['NODE_ENV'] !== 'production';
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS — only allow frontend origin
app.use(
  cors({
    origin: isDev
      ? ['http://localhost:3000', 'http://localhost:3001', FRONTEND_URL]
      : [FRONTEND_URL],
    credentials: true, // Required for httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookies
app.use(cookieParser());

// Request logging
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = (req as express.Request & { user?: { userId: string } }).user?.userId;
      return userId ?? req.ip ?? 'unknown';
    },
  }),
);

// Health check (no auth required)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] ?? 'development',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);


// Routes
app.use('/api/auth', authRouter);
app.use('/api/kits', kitRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler (must be last)
app.use(errorHandler);

export { app };

// ============================================================
// SERVER STARTUP
// ============================================================

async function start(): Promise<void> {
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    logger.error('MONGODB_URI not set');
    process.exit(1);
  }

  await connectDatabase(mongoUri);

  const port = Number(process.env['PORT'] ?? 3001);
  app.listen(port, () => {
    logger.info(`API server running on port ${port}`, {
      env: process.env['NODE_ENV'],
      port,
    });
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
