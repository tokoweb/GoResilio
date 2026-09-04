import { NextRequest, NextResponse } from 'next/server';
import { GeocodingService } from '../../../../domain/services/GeocodingService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query pencarian minimal harus memiliki 2 karakter.'
        },
        { status: 400 }
      );
    }

    const language = typeof body.language === 'string' ? body.language : 'id';
    const countryCode = typeof body.countryCode === 'string' ? body.countryCode : undefined;
    const limit = typeof body.limit === 'number' ? body.limit : 8;

    const results = await GeocodingService.search(query, {
      language,
      countryCode,
      limit
    });

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      data: results
    });
  } catch (err: any) {
    console.error('[POST /api/geocode/search] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Data lokasi sedang tidak dapat dimuat.',
        message: err instanceof Error ? err.message : 'Internal Server Error'
      },
      { status: 502 }
    );
  }
}
