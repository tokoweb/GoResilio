import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Let all Next.js API & page requests pass through seamlessly
  const response = NextResponse.next();
  response.headers.set('X-Platform', 'GoTangguh Spatial Engine');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
