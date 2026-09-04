import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export async function GET(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      'SELECT config_value as configValue FROM system_configs WHERE config_key = ? LIMIT 1',
      ['admin_dashboard_config']
    );

    if (rows && rows.length > 0) {
      const config = typeof rows[0].configValue === 'string'
        ? JSON.parse(rows[0].configValue)
        : rows[0].configValue;

      return NextResponse.json({ success: true, config });
    }

    return NextResponse.json({ success: true, config: null });
  } catch (error: any) {
    return NextResponse.json({ success: true, config: null });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const pool = getDbPool();
    const configJson = JSON.stringify(body);

    await pool.query(
      `INSERT INTO system_configs (config_key, config_value, updated_at) 
       VALUES ('admin_dashboard_config', ?, NOW()) 
       ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
      [configJson, configJson]
    );

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi bobot risiko, ambang batas, dan API key berhasil disimpan secara real-time.',
      config: body
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database MySQL tidak dapat diakses untuk menyimpan konfigurasi.'
      },
      { status: 500 }
    );
  }
}
