import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

interface UserRow {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userName = name || email.split('@')[0];

    if (isOfflineMode) {
      // Modo offline - salvar em memória
      const existingUser = inMemoryData.users.find((u) => u.email === email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }

      const newUser = {
        id: inMemoryData.users.length + 1,
        email,
        name: userName,
        password_hash: passwordHash,
        is_admin: false,
        status: 'active',
        last_login: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      inMemoryData.users.push(newUser);

      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        isAdmin: false,
      });

      const response = NextResponse.json({
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          isAdmin: false,
        },
      });

      // Set auth_token cookie for middleware authentication
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // Verificar se email já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Criar usuário
    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${userName}, ${passwordHash})
      RETURNING id, email, name, is_admin
    `;

    const user = result.rows[0] as UserRow;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false,
    });

    const response = NextResponse.json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin || false,
      },
    });

    // Set auth_token cookie for middleware authentication
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
