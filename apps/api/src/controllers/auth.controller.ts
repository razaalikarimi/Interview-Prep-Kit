import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { RegisterRequestSchema, LoginRequestSchema } from '@interview-prep/shared';
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

// ============================================================
// AUTH CONTROLLER
// Thin controller — delegates to service layer.
// ============================================================

export const authRouter = Router();

const isDev = process.env['NODE_ENV'] !== 'production';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

function setCookieToken(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? 'lax' : 'none',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });
}

authRouter.post('/register', authRateLimit, async (req: Request, res: Response, next) => {
  try {
    const validated = RegisterRequestSchema.parse(req.body);
    const { userId, token } = await registerUser(
      validated.email,
      validated.password,
      validated.name,
    );
    setCookieToken(res, token);
    res.status(201).json({ success: true, data: { userId, token, message: 'Registration successful' } });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', authRateLimit, async (req: Request, res: Response, next) => {
  try {
    const validated = LoginRequestSchema.parse(req.body);
    const { userId, token, name } = await loginUser(validated.email, validated.password);
    setCookieToken(res, token);
    res.json({ success: true, data: { userId, name, token, message: 'Login successful' } });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'User not found' },
      });
      return;
    }
    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});
