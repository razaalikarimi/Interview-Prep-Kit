import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRouter } from './controllers/auth.controller';
import { kitRouter } from './controllers/kit.controller';
import { errorHandler } from './middleware/error.middleware';
import { connectDatabase } from './infrastructure/database/connection';
import { logger } from './utils/logger';

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

// CORS — allow frontend origin and preview environments
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isDev) return callback(null, true);
      if (origin === FRONTEND_URL || origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(null, true);
    },
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

// Favicon handlers to prevent 404/500 errors in server logs
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});
app.get('/favicon.png', (_req, res) => {
  res.status(204).end();
});

// Root & Health checks (instant response, no DB wait needed)
const rootHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'api',
    message: 'AI Interview Prep Kit API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] ?? 'production',
  });
};

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] ?? 'production',
  });
};

app.get('/', rootHandler);
app.get('/api', rootHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Ensure database connection for authenticated and kit routes
app.use(async (_req, _res, next) => {
  const mongoUri = process.env['MONGODB_URI'];
  if (mongoUri) {
    try {
      await connectDatabase(mongoUri);
    } catch (err) {
      logger.error('Serverless database connection error', { error: (err as Error).message });
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/kits', kitRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
export { app };

// ============================================================
// SERVER STARTUP (STANDALONE ONLY — NEVER IN SERVERLESS)
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

const isServerless = Boolean(
  process.env['VERCEL'] ||
  process.env['VERCEL_ENV'] ||
  process.env['NOW_REGION'] ||
  process.env['AWS_LAMBDA_FUNCTION_NAME'] ||
  process.env['LAMBDA_TASK_ROOT']
);

// Only listen if executed directly via node dist/server.js and not in serverless/test
if (require.main === module && !isServerless && process.env['NODE_ENV'] !== 'test') {
  start().catch((err) => {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  });
}
