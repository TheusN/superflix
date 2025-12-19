import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (isOfflineMode) {
      // Get items with progress > 0 and < 95%
      const continueWatching = inMemoryData.watchHistory
        .filter((h) => h.user_id === user.userId && h.progress > 0 && h.progress < 0.95)
        .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime())
        .slice(0, 20);
      return NextResponse.json(continueWatching);
    }

    const result = await sql`
      SELECT * FROM watch_history
      WHERE user_id = ${user.userId}
        AND progress > 0
        AND progress < 0.95
      ORDER BY watched_at DESC
      LIMIT 20
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get continue watching error:', error);
    return NextResponse.json({ error: 'Erro ao buscar continuar assistindo' }, { status: 500 });
  }
}
