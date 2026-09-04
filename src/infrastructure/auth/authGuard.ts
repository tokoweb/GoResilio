import { NextRequest, NextResponse } from 'next/server';
import { JwtHelper, TokenPayload } from './jwt';

export type UserRole =
  | 'Home Buyer'
  | 'Property Developer'
  | 'Lender / Bank'
  | 'Consultant / Auditor'
  | 'Super Admin (RDI)';

export interface AuthSuccess {
  user: TokenPayload;
}

/**
 * Server-Side Authentication & Authorization Guards for Next.js App Router
 */
export class AuthGuard {
  /**
   * Resolves verified identity from HttpOnly cookie or Authorization Bearer header
   */
  static async authenticateRequest(req: NextRequest): Promise<TokenPayload | null> {
    try {
      const cookieToken = req.cookies.get('gotangguh_session_token')?.value;
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

      const token = cookieToken || headerToken;
      if (!token) {
        return null;
      }

      const payload = await JwtHelper.verifyToken(token);
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Enforces that the request has a valid authenticated session
   */
  static async requireAuth(req: NextRequest): Promise<AuthSuccess | NextResponse> {
    const user = await this.authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sesi autentikasi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.' },
        { status: 401 }
      );
    }
    return { user };
  }

  /**
   * Enforces server-side Role-Based Access Control (RBAC)
   */
  static async requireRole(req: NextRequest, allowedRoles: (UserRole | string)[]): Promise<AuthSuccess | NextResponse> {
    const authResult = await this.requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 response
    }

    const { user } = authResult;
    const isAllowed = allowedRoles.includes(user.role) || user.role === 'Super Admin (RDI)';

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Akses ditolak: Peran akun '${user.role}' tidak memiliki izin otorisasi untuk mengakses sumber daya ini.`
        },
        { status: 403 }
      );
    }

    return { user };
  }
}
