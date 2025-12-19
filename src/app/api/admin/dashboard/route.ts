import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (isOfflineMode) {
      const totalUsers = inMemoryData.users.length;
      const activeUsers = inMemoryData.users.filter((u) => u.status === 'active').length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = inMemoryData.users.filter(
        (u) => new Date(u.created_at) >= today
      ).length;
      const totalWatchHistory = inMemoryData.watchHistory.length;

      return NextResponse.json({
        totalUsers,
        activeUsers,
        newUsersToday,
        totalWatchHistory,
        recentUsers: inMemoryData.users.slice(-10).reverse(),
      });
    }

    // Get stats
    const [usersStats, historyStats, recentUsers] = await Promise.all([
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today
        FROM users
      `,
      sql`SELECT COUNT(*) as total FROM watch_history`,
      sql`
        SELECT id, email, name, is_admin, status, created_at, last_login
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `,
    ]);

    return NextResponse.json({
      totalUsers: parseInt(usersStats.rows[0]?.total || '0'),
      activeUsers: parseInt(usersStats.rows[0]?.active || '0'),
      newUsersToday: parseInt(usersStats.rows[0]?.new_today || '0'),
      totalWatchHistory: parseInt(historyStats.rows[0]?.total || '0'),
      recentUsers: recentUsers.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
