import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export async function GET() {
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
    // Graceful fallback when MySQL server is offline / uninitialized
    return NextResponse.json({ success: true, config: null });
  }
}

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
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
    console.error('[Admin Config POST Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database MySQL tidak dapat diakses untuk menyimpan konfigurasi.'
      },
      { status: 500 }
    );
  }
}
