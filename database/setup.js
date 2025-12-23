/**
 * Script para configurar o banco de dados PostgreSQL/Supabase
 *
 * Uso: node database/setup.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não configurada no .env.local');
  process.exit(1);
}

// Desabilitar verificação de certificado para ambientes de desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setup() {
  console.log('🚀 Iniciando configuração do banco de dados...\n');

  const client = await pool.connect();

  try {
    // 1. Criar tabela users
    console.log('📦 Criando tabela users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Tabela users criada');

    // 2. Criar tabela watch_history
    console.log('📦 Criando tabela watch_history...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL,
        imdb_id VARCHAR(20),
        title VARCHAR(255) NOT NULL,
        poster_path VARCHAR(255),
        media_type VARCHAR(20) NOT NULL,
        season INTEGER,
        episode INTEGER,
        progress REAL DEFAULT 0,
        watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tmdb_id, season, episode)
      )
    `);
    console.log('  ✅ Tabela watch_history criada');

    // 3. Criar tabela favorites
    console.log('📦 Criando tabela favorites...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster_path VARCHAR(255),
        media_type VARCHAR(20) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tmdb_id)
      )
    `);
    console.log('  ✅ Tabela favorites criada');

    // 4. Criar tabela system_settings
    console.log('📦 Criando tabela system_settings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `);
    console.log('  ✅ Tabela system_settings criada');

    // 5. Criar tabela admin_logs
    console.log('📦 Criando tabela admin_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Tabela admin_logs criada');

    // 6. Inserir configurações do sistema
    console.log('\n⚙️ Inserindo configurações do sistema...');
    await client.query(`
      INSERT INTO system_settings (key, value, description) VALUES
        ('site_name', 'Superflix', 'Nome do site'),
        ('site_description', 'Sua plataforma de streaming favorita', 'Descrição do site'),
        ('maintenance_mode', 'false', 'Modo de manutenção'),
        ('allow_registration', 'true', 'Permitir registro de novos usuários'),
        ('default_theme', 'dark', 'Tema padrão do site')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('  ✅ Configurações inseridas');

    // 7. Criar usuário admin master padrão
    console.log('\n👤 Criando usuário administrador master...');

    const adminMasterEmail = 'admin@admin.com';
    const adminMasterPassword = '123456';
    const adminMasterName = 'Admin Master';

    const existingAdminMaster = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminMasterEmail]
    );

    const passwordHashMaster = await bcrypt.hash(adminMasterPassword, 10);

    if (existingAdminMaster.rows.length > 0) {
      console.log('  ⚠️ Admin Master já existe, atualizando...');
      await client.query(
        'UPDATE users SET password_hash = $1, is_admin = TRUE, name = $2 WHERE email = $3',
        [passwordHashMaster, adminMasterName, adminMasterEmail]
      );
      console.log('  ✅ Admin Master atualizado');
    } else {
      await client.query(
        `INSERT INTO users (email, name, password_hash, is_admin, status)
         VALUES ($1, $2, $3, TRUE, 'active')`,
        [adminMasterEmail, adminMasterName, passwordHashMaster]
      );
      console.log('  ✅ Admin Master criado');
    }

    console.log('\n🎉 ================================');
    console.log('   SETUP CONCLUÍDO COM SUCESSO!');
    console.log('================================\n');
    console.log('📋 Credenciais do Admin Master:');
    console.log(`   Email: ${adminMasterEmail}`);
    console.log(`   Senha: ${adminMasterPassword}`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
