import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items deve ser um array' }, { status: 400 });
    }

    const synced: unknown[] = [];

    for (const item of items) {
      const { tmdb_id, imdb_id, title, poster_path, media_type, season, episode, progress } = item;

      if (!tmdb_id || !title || !media_type) continue;

      if (isOfflineMode) {
        const existingIndex = inMemoryData.watchHistory.findIndex(
          (h) =>
            h.user_id === user.userId &&
            h.tmdb_id === tmdb_id &&
            h.season === season &&
            h.episode === episode
        );

        const historyItem = {
          id: existingIndex >= 0 ? inMemoryData.watchHistory[existingIndex].id : Date.now(),
          user_id: user.userId,
          tmdb_id,
          imdb_id: imdb_id || null,
          title,
          poster_path: poster_path || null,
          media_type,
          season: season || null,
          episode: episode || null,
          progress: progress || 0,
          watched_at: new Date(),
        };

        if (existingIndex >= 0) {
          inMemoryData.watchHistory[existingIndex] = historyItem;
        } else {
          inMemoryData.watchHistory.push(historyItem);
        }

        synced.push(historyItem);
      } else {
        const result = await sql`
          INSERT INTO watch_history (user_id, tmdb_id, imdb_id, title, poster_path, media_type, season, episode, progress)
          VALUES (${user.userId}, ${tmdb_id}, ${imdb_id || null}, ${title}, ${poster_path || null}, ${media_type}, ${season || null}, ${episode || null}, ${progress || 0})
          ON CONFLICT (user_id, tmdb_id, season, episode)
          DO UPDATE SET
            progress = GREATEST(watch_history.progress, EXCLUDED.progress),
            watched_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        if (result.rows.length > 0) {
          synced.push(result.rows[0]);
        }
      }
    }

    return NextResponse.json({
      message: `${synced.length} itens sincronizados`,
      synced,
    });
  } catch (error) {
    console.error('Sync history error:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar histórico' }, { status: 500 });
  }
}
