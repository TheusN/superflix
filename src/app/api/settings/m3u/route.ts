import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEFAULT_M3U_URL } from '@/lib/constants';

export async function GET() {
  try {
    if (isOfflineMode) {
      return NextResponse.json({
        m3u_url: inMemoryData.settings.get('m3u_url') || DEFAULT_M3U_URL,
      });
    }

    const result = await sql`
      SELECT value FROM system_settings WHERE key = 'm3u_url'
    `;

    return NextResponse.json({
      m3u_url: result.rows[0]?.value || DEFAULT_M3U_URL,
    });
  } catch (error) {
    console.error('Get M3U URL error:', error);
    return NextResponse.json({ m3u_url: DEFAULT_M3U_URL });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { m3u_url } = await request.json();

    if (!m3u_url) {
      return NextResponse.json({ error: 'URL M3U é obrigatória' }, { status: 400 });
    }

    if (isOfflineMode) {
      inMemoryData.settings.set('m3u_url', m3u_url);
      return NextResponse.json({
        message: 'URL M3U atualizada com sucesso',
        m3u_url,
      });
    }

    await sql`
      INSERT INTO system_settings (key, value, updated_at, updated_by)
      VALUES ('m3u_url', ${m3u_url}, CURRENT_TIMESTAMP, ${user.userId})
      ON CONFLICT (key)
      DO UPDATE SET value = ${m3u_url}, updated_at = CURRENT_TIMESTAMP, updated_by = ${user.userId}
    `;

    return NextResponse.json({
      message: 'URL M3U atualizada com sucesso',
      m3u_url,
    });
  } catch (error) {
    console.error('Update M3U URL error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar URL M3U' }, { status: 500 });
  }
}
