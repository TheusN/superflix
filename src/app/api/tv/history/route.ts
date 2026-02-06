import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode } from '@/lib/db';
import { getCurrentUser, verifyToken } from '@/lib/auth';

// Evitar cache de dados pessoais
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TVHistory {
  id: number;
  user_id: number;
  channel_id: string;
  channel_name: string;
  channel_logo: string | null;
  channel_category: string | null;
  watched_at: Date;
}

// GET - Listar historico do usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (isOfflineMode) {
      return NextResponse.json([]);
    }

    const result = await sql<TVHistory>`
      SELECT * FROM tv_history
      WHERE user_id = ${user.userId}
      ORDER BY watched_at DESC
      LIMIT 20
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching TV history:', error);
    return NextResponse.json({ error: 'Erro ao buscar historico' }, { status: 500 });
  }
}

// POST - Adicionar ao historico
export async function POST(request: NextRequest) {
  try {
    // Suportar autenticacao via header ou body (para sendBeacon)
    let user = await getCurrentUser(request);
    const body = await request.json();
    const { channel_id, channel_name, channel_logo, channel_category, token } = body;

    if (!user && token) {
      user = verifyToken(token);
    }

    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (!channel_id || !channel_name) {
      return NextResponse.json({ error: 'channel_id e channel_name sao obrigatorios' }, { status: 400 });
    }

    if (isOfflineMode) {
      return NextResponse.json({ message: 'Historico salvo (offline)' });
    }

    await sql`
      INSERT INTO tv_history (user_id, channel_id, channel_name, channel_logo, channel_category)
      VALUES (${user.userId}, ${channel_id}, ${channel_name}, ${channel_logo || null}, ${channel_category || null})
      ON CONFLICT (user_id, channel_id) DO UPDATE SET
        channel_name = EXCLUDED.channel_name,
        channel_logo = EXCLUDED.channel_logo,
        channel_category = EXCLUDED.channel_category,
        watched_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ message: 'Historico salvo' });
  } catch (error) {
    console.error('Error saving TV history:', error);
    return NextResponse.json({ error: 'Erro ao salvar historico' }, { status: 500 });
  }
}

// DELETE - Limpar historico
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (isOfflineMode) {
      return NextResponse.json({ message: 'Historico limpo (offline)' });
    }

    await sql`
      DELETE FROM tv_history
      WHERE user_id = ${user.userId}
    `;

    return NextResponse.json({ message: 'Historico limpo' });
  } catch (error) {
    console.error('Error clearing TV history:', error);
    return NextResponse.json({ error: 'Erro ao limpar historico' }, { status: 500 });
  }
}
