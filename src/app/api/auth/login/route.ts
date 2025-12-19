import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    let user: {
      id: number;
      email: string;
      name: string;
      password_hash: string;
      is_admin: boolean;
    } | null = null;

    if (isOfflineMode) {
      const foundUser = inMemoryData.users.find((u) => u.email === email);
      if (foundUser) {
        user = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          password_hash: foundUser.password_hash,
          is_admin: foundUser.is_admin,
        };
      }
    } else {
      const result = await sql`
        SELECT id, email, name, password_hash, is_admin
        FROM users
        WHERE email = ${email} AND status = 'active'
      `;

      if (result.rows.length > 0) {
        const row = result.rows[0] as { id: number; email: string; name: string; password_hash: string; is_admin: boolean };
        user = row;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Atualizar last_login
    if (!isOfflineMode) {
      await sql`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}
      `;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false,
    });

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
