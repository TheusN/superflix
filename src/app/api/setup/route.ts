import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Chave secreta para proteger o endpoint
const SETUP_SECRET = 'superflix-setup-2024';

export async function GET(request: NextRequest) {
  // Verificar chave de segurança
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== SETUP_SECRET) {
    return NextResponse.json(
      { error: 'Acesso não autorizado' },
      { status: 401 }
    );
  }

  const logs: string[] = [];

  try {
    logs.push('🚀 Iniciando configuração do banco de dados...');

    // 1. Inicializar tabelas
    await initializeDatabase();
    logs.push('✅ Tabelas criadas');

    // 2. Inserir configurações do sistema
    await query(`
      INSERT INTO system_settings (key, value, description) VALUES
        ('site_name', 'Superflix', 'Nome do site'),
        ('site_description', 'Sua plataforma de streaming favorita', 'Descrição do site'),
        ('maintenance_mode', 'false', 'Modo de manutenção'),
        ('allow_registration', 'true', 'Permitir registro de novos usuários'),
        ('default_theme', 'dark', 'Tema padrão do site')
      ON CONFLICT (key) DO NOTHING
    `);
    logs.push('✅ Configurações do sistema inseridas');

    // 3. Criar usuário admin
    const adminEmail = 'matheusnattan8@gmail.com';
    const adminPassword = 'Adm1478@';
    const adminName = 'Administrador';

    const existingAdmin = await query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      logs.push('⚠️ Usuário admin já existe, atualizando...');

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await query(
        'UPDATE users SET password_hash = $1, is_admin = TRUE, name = $2 WHERE email = $3',
        [passwordHash, adminName, adminEmail]
      );
      logs.push('✅ Usuário admin atualizado');
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await query(
        `INSERT INTO users (email, name, password_hash, is_admin, status)
         VALUES ($1, $2, $3, TRUE, 'active')`,
        [adminEmail, adminName, passwordHash]
      );
      logs.push('✅ Usuário admin criado');
    }

    logs.push('');
    logs.push('🎉 SETUP CONCLUÍDO COM SUCESSO!');
    logs.push('');
    logs.push('📋 Credenciais do Admin:');
    logs.push('   Email: matheusnattan8@gmail.com');
    logs.push('   Senha: Adm1478@');

    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!',
      logs,
      admin: {
        email: 'matheusnattan8@gmail.com',
        password: 'Adm1478@',
      },
    });
  } catch (error) {
    console.error('Erro no setup:', error);
    logs.push(`❌ ERRO: ${error}`);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
        logs,
      },
      { status: 500 }
    );
  }
}
