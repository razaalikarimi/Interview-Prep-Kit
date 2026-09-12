import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../infrastructure/database/models/user.model.js';
import { ErrorCodes } from '@interview-prep/shared';
import { logger } from '../utils/logger.js';

// ============================================================
// AUTH SERVICE
// ============================================================

const SALT_ROUNDS = 12;
const JWT_EXPIRY = '24h';

export function getJWTSecret(): string {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error('SESSION_SECRET environment variable not set');
  return secret;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<{ userId: string; token: string }> {
  // Check for existing user
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error(`${ErrorCodes.USER_EXISTS}: Email already registered`);
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name: name.trim(),
  });

  logger.info('User registered', { userId: user._id.toString() });

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email } satisfies AuthPayload,
    getJWTSecret(),
    { expiresIn: JWT_EXPIRY },
  );

  return { userId: user._id.toString(), token };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ userId: string; token: string; name: string }> {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new Error(`${ErrorCodes.INVALID_CREDENTIALS}: Invalid email or password`);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error(`${ErrorCodes.INVALID_CREDENTIALS}: Invalid email or password`);
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email } satisfies AuthPayload,
    getJWTSecret(),
    { expiresIn: JWT_EXPIRY },
  );

  logger.info('User logged in', { userId: user._id.toString() });

  return { userId: user._id.toString(), token, name: user.name };
}

export function verifyToken(token: string): AuthPayload {
  const payload = jwt.verify(token, getJWTSecret()) as AuthPayload;
  return payload;
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId).select('-passwordHash');
  return user;
}
