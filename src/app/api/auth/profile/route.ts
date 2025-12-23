import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface UserRow {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (isOfflineMode) {
      const userIndex = inMemoryData.users.findIndex((u) => u.id === authUser.userId);
      if (userIndex >= 0) {
        inMemoryData.users[userIndex].name = name.trim();
        inMemoryData.users[userIndex].updated_at = new Date();
      }

      return NextResponse.json({
        message: 'Perfil atualizado com sucesso',
        user: {
          id: authUser.userId,
          email: authUser.email,
          name: name.trim(),
          isAdmin: authUser.isAdmin,
        },
      });
    }

    const result = await sql`
      UPDATE users
      SET name = ${name.trim()}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${authUser.userId}
      RETURNING id, email, name, is_admin
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = result.rows[0] as UserRow;

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
