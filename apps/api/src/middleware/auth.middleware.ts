import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { ErrorCodes } from '@interview-prep/shared';

// ============================================================
// AUTH MIDDLEWARE
// Reads JWT from httpOnly cookie and attaches userId to request.
// ============================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['auth_token'] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: ErrorCodes.UNAUTHENTICATED, message: 'Authentication required' },
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: ErrorCodes.UNAUTHENTICATED, message: 'Invalid or expired session' },
    });
  }
}
