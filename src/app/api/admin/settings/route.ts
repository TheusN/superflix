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
      const settings: Record<string, string> = {};
      inMemoryData.settings.forEach((value, key) => {
        settings[key] = value;
      });
      return NextResponse.json({ settings });
    }

    const result = await sql`
      SELECT key, value, description, updated_at
      FROM system_settings
      ORDER BY key
    `;

    const settings: Record<string, { value: string; description: string; updated_at: string }> = {};
    result.rows.forEach((row) => {
      const r = row as { key: string; value: string; description: string; updated_at: string };
      settings[r.key] = {
        value: r.value,
        description: r.description,
        updated_at: r.updated_at,
      };
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { key, value, description } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Key é obrigatória' }, { status: 400 });
    }

    if (isOfflineMode) {
      inMemoryData.settings.set(key, value || '');
      return NextResponse.json({
        message: 'Configuração atualizada com sucesso',
        setting: { key, value },
      });
    }

    await sql`
      INSERT INTO system_settings (key, value, description, updated_at, updated_by)
      VALUES (${key}, ${value || ''}, ${description || null}, CURRENT_TIMESTAMP, ${user.userId})
      ON CONFLICT (key)
      DO UPDATE SET
        value = ${value || ''},
        description = COALESCE(${description}, system_settings.description),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ${user.userId}
    `;

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, action, target_type, details)
      VALUES (${user.userId}, 'update_setting', 'setting', ${JSON.stringify({ key, value })})
    `;

    return NextResponse.json({
      message: 'Configuração atualizada com sucesso',
      setting: { key, value },
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 });
  }
}