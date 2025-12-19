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
      const history = inMemoryData.watchHistory
        .filter((h) => h.user_id === user.userId)
        .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
      return NextResponse.json(history);
    }

    const result = await sql`
      SELECT * FROM watch_history
      WHERE user_id = ${user.userId}
      ORDER BY watched_at DESC
      LIMIT 100
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await request.json();
    const { tmdb_id, imdb_id, title, poster_path, media_type, season, episode, progress } = data;

    if (!tmdb_id || !title || !media_type) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

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

      return NextResponse.json(historyItem);
    }

    const result = await sql`
      INSERT INTO watch_history (user_id, tmdb_id, imdb_id, title, poster_path, media_type, season, episode, progress)
      VALUES (${user.userId}, ${tmdb_id}, ${imdb_id || null}, ${title}, ${poster_path || null}, ${media_type}, ${season || null}, ${episode || null}, ${progress || 0})
      ON CONFLICT (user_id, tmdb_id, season, episode)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        watched_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Save history error:', error);
    return NextResponse.json({ error: 'Erro ao salvar histórico' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Clear all history for user
    if (isOfflineMode) {
      inMemoryData.watchHistory = inMemoryData.watchHistory.filter(
        (h) => h.user_id !== user.userId
      );
      return NextResponse.json({ message: 'Histórico limpo com sucesso' });
    }

    await sql`
      DELETE FROM watch_history WHERE user_id = ${user.userId}
    `;

    return NextResponse.json({ message: 'Histórico limpo com sucesso' });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json({ error: 'Erro ao limpar histórico' }, { status: 500 });
  }
}
