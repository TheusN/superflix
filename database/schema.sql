-- =============================================
-- SUPERFLIX DATABASE SCHEMA
-- PostgreSQL / Supabase
-- =============================================

-- Extensão para UUID (opcional, caso queira usar UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: users
-- Armazena informações dos usuários
-- =============================================
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
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =============================================
-- TABELA: watch_history
-- Histórico de visualização dos usuários
-- =============================================
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
);

-- Índices para watch_history
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_tmdb ON watch_history(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched ON watch_history(watched_at DESC);

-- =============================================
-- TABELA: favorites
-- Conteúdos favoritos dos usuários
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    media_type VARCHAR(20) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id)
);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tmdb ON favorites(tmdb_id);

-- =============================================
-- TABELA: system_settings
-- Configurações do sistema
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- =============================================
-- TABELA: admin_logs
-- Logs de ações administrativas
-- =============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- =============================================
-- CONFIGURAÇÕES INICIAIS DO SISTEMA
-- =============================================
INSERT INTO system_settings (key, value, description) VALUES
    ('site_name', 'Superflix', 'Nome do site'),
    ('site_description', 'Sua plataforma de streaming favorita', 'Descrição do site'),
    ('maintenance_mode', 'false', 'Modo de manutenção'),
    ('allow_registration', 'true', 'Permitir registro de novos usuários'),
    ('default_theme', 'dark', 'Tema padrão do site')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- USUÁRIO ADMIN MASTER PADRÃO
-- Email: admin@admin.com
-- Senha: 123456
-- IMPORTANTE: Altere a senha após o primeiro login!
-- =============================================
-- A senha '123456' hasheada com bcrypt (custo 10):
-- $2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrkHALFNIkr8i0VmNGZ3mw2K7G
INSERT INTO users (email, name, password_hash, is_admin, status) VALUES
    ('admin@admin.com', 'Admin Master', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrkHALFNIkr8i0VmNGZ3mw2K7G', TRUE, 'active')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_admin = TRUE,
    name = EXCLUDED.name;

-- =============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para system_settings
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIM DO SCHEMA
-- =============================================
