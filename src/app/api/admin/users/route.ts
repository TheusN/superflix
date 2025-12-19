import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    if (isOfflineMode) {
      let users = [...inMemoryData.users];

      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email.toLowerCase().includes(searchLower) ||
            u.name.toLowerCase().includes(searchLower)
        );
      }

      const total = users.length;
      const paginatedUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit)
        .map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          is_admin: u.is_admin,
          status: u.status,
          last_login: u.last_login,
          created_at: u.created_at,
        }));

      return NextResponse.json({
        users: paginatedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    let result;
    let countResult;

    if (search) {
      result = await sql`
        SELECT id, email, name, is_admin, status, last_login, created_at
        FROM users
        WHERE email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM users
        WHERE email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}
      `;
    } else {
      result = await sql`
        SELECT id, email, name, is_admin, status, last_login, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM users`;
    }

    const total = parseInt(countResult.rows[0]?.total || '0');

    return NextResponse.json({
      users: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId e action são obrigatórios' }, { status: 400 });
    }

    if (isOfflineMode) {
      const userIndex = inMemoryData.users.findIndex((u) => u.id === userId);
      if (userIndex < 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      switch (action) {
        case 'ban':
          inMemoryData.users[userIndex].status = 'banned';
          break;
        case 'unban':
          inMemoryData.users[userIndex].status = 'active';
          break;
        case 'makeAdmin':
          inMemoryData.users[userIndex].is_admin = true;
          break;
        case 'removeAdmin':
          inMemoryData.users[userIndex].is_admin = false;
          break;
        case 'update':
          if (data?.name) inMemoryData.users[userIndex].name = data.name;
          break;
      }

      return NextResponse.json({
        message: 'Usuário atualizado com sucesso',
        user: inMemoryData.users[userIndex],
      });
    }

    let result;

    switch (action) {
      case 'ban':
        result = await sql`
          UPDATE users SET status = 'banned', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId} RETURNING *
        `;
        break;
      case 'unban':
        result = await sql`
          UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId} RETURNING *
        `;
        break;
      case 'makeAdmin':
        result = await sql`
          UPDATE users SET is_admin = true, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId} RETURNING *
        `;
        break;
      case 'removeAdmin':
        result = await sql`
          UPDATE users SET is_admin = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId} RETURNING *
        `;
        break;
      case 'update':
        if (data?.name) {
          result = await sql`
            UPDATE users SET name = ${data.name}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${userId} RETURNING *
          `;
        }
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    if (!result || result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (${user.userId}, ${action}, 'user', ${userId}, ${JSON.stringify(data || {})})
    `;

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}