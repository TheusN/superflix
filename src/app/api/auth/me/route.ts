import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    let user: {
      id: number;
      email: string;
      name: string;
      is_admin: boolean;
      status?: string;
      created_at?: Date;
    } | null = null;

    if (isOfflineMode) {
      const foundUser = inMemoryData.users.find((u) => u.id === authUser.userId);
      if (foundUser) {
        user = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          is_admin: foundUser.is_admin,
          status: foundUser.status,
          created_at: foundUser.created_at,
        };
      }
    } else {
      const result = await sql`
        SELECT id, email, name, is_admin, status, created_at
        FROM users
        WHERE id = ${authUser.userId}
      `;
      if (result.rows.length > 0) {
        const row = result.rows[0] as { id: number; email: string; name: string; is_admin: boolean; status?: string; created_at?: Date };
        user = row;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin || false,
      status: user.status,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}
