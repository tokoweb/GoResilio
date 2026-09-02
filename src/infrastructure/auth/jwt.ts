/**
 * Lightweight, Edge-Runtime-compatible JWT implementation using standard Web Crypto API
 */

const JWT_SECRET = process.env.JWT_SECRET || 'gotangguh_super_resilient_secret_key_2026_rdi';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  tierLevel: string;
  exp?: number;
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): any {
  return new TextEncoder().encode(str);
}

// Base64Url encoding
function base64UrlEncode(data: Uint8Array | string): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = Buffer.from(data).toString('base64');
  } else {
    base64 = Buffer.from(data).toString('base64');
  }
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Base64Url decoding
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export class JwtHelper {
  /**
   * Sign a new JWT token valid for 7 days
   */
  public static async signToken(payload: TokenPayload): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
    const fullPayload: TokenPayload = {
      ...payload,
      exp
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    // Web Crypto HMAC SHA-256
    const key = await crypto.subtle.importKey(
      'raw',
      stringToUint8Array(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      stringToUint8Array(dataToSign)
    );

    const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
    return `${dataToSign}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   */
  public static async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      // Verify signature
      const key = await crypto.subtle.importKey(
        'raw',
        stringToUint8Array(JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
      let paddedSig = sigBase64;
      while (paddedSig.length % 4) paddedSig += '=';
      const sigBytes = Buffer.from(paddedSig, 'base64');

      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        stringToUint8Array(dataToSign)
      );

      if (!isValid) return null;

      const payloadStr = base64UrlDecode(encodedPayload);
      const payload: TokenPayload = JSON.parse(payloadStr);

      // Check expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }
}
