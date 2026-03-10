import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@/types';

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

const getAccessSecret = (): string => {
  const secret = process.env['JWT_ACCESS_SECRET'];
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not set');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env['JWT_REFRESH_SECRET'];
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not set');
  }
  return secret;
};

export const generateRefreshJti = (): string => crypto.randomUUID();

export const signAccessToken = (userId: string, role: UserRole): string => {
  const payload: AccessTokenPayload = { sub: userId, role };
  // -------------JWT_ACCESS------
  const expiresIn = (process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m') as unknown as Exclude<SignOptions['expiresIn'], undefined>;
  return jwt.sign(payload, getAccessSecret(), { expiresIn });
};

export const signRefreshToken = (userId: string, jti: string): string => {
  const payload: RefreshTokenPayload = { sub: userId, jti };

  // ----------------JWT_REFRESH-----------
  const expiresIn = (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d') as unknown as Exclude<SignOptions['expiresIn'], undefined>;
  return jwt.sign(payload, getRefreshSecret(), { expiresIn });
};

export const verifyAccessToken = (token: string): AccessTokenPayload & JwtPayload => {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload & JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload & JwtPayload => {
  return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload & JwtPayload;
};
