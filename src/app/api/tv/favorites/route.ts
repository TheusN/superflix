import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface TVFavorite {
  id: number;
  user_id: number;
  channel_id: string;
  channel_name: string;
  channel_logo: string | null;
  channel_category: string | null;
  added_at: Date;
}

// GET - Listar favoritos do usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (isOfflineMode) {
      return NextResponse.json([]);
    }

    const result = await sql<TVFavorite>`
      SELECT * FROM tv_favorites
      WHERE user_id = ${user.userId}
      ORDER BY added_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching TV favorites:', error);
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

// POST - Adicionar favorito
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { channel_id, channel_name, channel_logo, channel_category } = await request.json();

    if (!channel_id || !channel_name) {
      return NextResponse.json({ error: 'channel_id e channel_name sao obrigatorios' }, { status: 400 });
    }

    if (isOfflineMode) {
      return NextResponse.json({ message: 'Favorito adicionado (offline)' });
    }

    await sql`
      INSERT INTO tv_favorites (user_id, channel_id, channel_name, channel_logo, channel_category)
      VALUES (${user.userId}, ${channel_id}, ${channel_name}, ${channel_logo || null}, ${channel_category || null})
      ON CONFLICT (user_id, channel_id) DO UPDATE SET
        channel_name = EXCLUDED.channel_name,
        channel_logo = EXCLUDED.channel_logo,
        channel_category = EXCLUDED.channel_category,
        added_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ message: 'Favorito adicionado' });
  } catch (error) {
    console.error('Error adding TV favorite:', error);
    return NextResponse.json({ error: 'Erro ao adicionar favorito' }, { status: 500 });
  }
}

// DELETE - Remover favorito
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { channel_id } = await request.json();

    if (!channel_id) {
      return NextResponse.json({ error: 'channel_id e obrigatorio' }, { status: 400 });
    }

    if (isOfflineMode) {
      return NextResponse.json({ message: 'Favorito removido (offline)' });
    }

    await sql`
      DELETE FROM tv_favorites
      WHERE user_id = ${user.userId} AND channel_id = ${channel_id}
    `;

    return NextResponse.json({ message: 'Favorito removido' });
  } catch (error) {
    console.error('Error removing TV favorite:', error);
    return NextResponse.json({ error: 'Erro ao remover favorito' }, { status: 500 });
  }
}
