import crypto from 'crypto';
import { getJwtSecret } from '../../infrastructure/auth/jwt';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  fullName?: string;
  tierLevel?: string;
  iat?: number;
  exp?: number;
}

/**
 * Production-ready HMAC-SHA256 JWT Signer / Verifier
 */
export class TokenService {
  static sign(payload: AuthTokenPayload): string {
    const secret = getJwtSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days expiration
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  static verify(token: string): AuthTokenPayload | null {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const secret = getJwtSecret();
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url');

      if (parts[2].length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expectedSig))) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }

      return payload as AuthTokenPayload;
    } catch {
      return null;
    }
  }
}
