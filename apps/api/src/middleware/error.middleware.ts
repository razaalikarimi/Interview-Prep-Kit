import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// ============================================================
// ERROR HANDLER MIDDLEWARE
// Returns structured errors. Never exposes stack traces in prod.
// ============================================================

const isDev = process.env['NODE_ENV'] !== 'production';

function parseErrorCode(message: string): { code: string; message: string } {

  // Error messages may be prefixed with error code: "ERROR_CODE: message"
  const colonIdx = message.indexOf(':');
  if (colonIdx > 0) {
    const possibleCode = message.slice(0, colonIdx).trim();
    if (/^[A-Z_]+$/.test(possibleCode)) {
      return { code: possibleCode, message: message.slice(colonIdx + 1).trim() };
    }
  }
  return { code: 'INTERNAL_ERROR', message };
}

function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    KIT_NOT_FOUND: 404,
    NOT_FOUND: 404,
    QUESTION_NOT_FOUND: 404,
    FLASHCARD_NOT_FOUND: 404,
    INVALID_INPUT: 400,
    INVALID_URL: 400,
    INVALID_CREDENTIALS: 401,
    USER_EXISTS: 409,
    KIT_ALREADY_RUNNING: 409,
    CONCURRENT_UPDATE: 409,
    RATE_LIMITED: 429,
    LLM_RATE_LIMITED: 429,
    SSRF_BLOCKED: 403,
    REDIRECT_UNSAFE: 403,
  };
  return statusMap[code] ?? 500;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let statusCode = 500;

  if (err instanceof Error) {
    const parsed = parseErrorCode(err.message);
    code = parsed.code;
    message = parsed.message;
    statusCode = getStatusCode(code);

    if (isDev) {
      logger.error('Request error', {
        code,
        message,
        path: req.path,
        stack: err.stack,
      });
    } else {
      logger.error('Request error', { code, message: err.message, stack: err.stack, path: req.path });
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: isDev ? message : sanitizeMessage(code, message),
    },
  });
}

function sanitizeMessage(code: string, message: string): string {
  // In production, don't expose internal details for 5xx errors
  if (code === 'INTERNAL_ERROR') return 'An unexpected error occurred';
  return message;
}
