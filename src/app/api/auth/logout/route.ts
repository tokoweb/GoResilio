import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Sesi logout berhasil.'
  });

  // Clear cookie
  response.cookies.delete('gotangguh_session_token');
  return response;
}
