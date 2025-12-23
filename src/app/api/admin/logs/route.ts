import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface CountRow {
  total?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (isOfflineMode) {
      return NextResponse.json({
        logs: [],
        total: 0,
        page,
        totalPages: 0,
      });
    }

    const [result, countResult] = await Promise.all([
      sql`
        SELECT
          al.id,
          al.admin_id,
          u.email as admin_email,
          al.action,
          al.target_type,
          al.target_id,
          al.details,
          al.ip_address,
          al.created_at
        FROM admin_logs al
        LEFT JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`SELECT COUNT(*) as total FROM admin_logs`,
    ]);

    const countRow = countResult.rows[0] as CountRow | undefined;
    const total = parseInt(countRow?.total || '0');

    return NextResponse.json({
      logs: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
}