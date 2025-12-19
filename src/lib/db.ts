import { sql } from '@vercel/postgres';

// Verificar se está em modo offline (sem banco)
const isOfflineMode = !process.env.POSTGRES_URL;

// Pool simulado para modo offline
interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  is_admin: boolean;
  status: string;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface WatchHistoryItem {
  id: number;
  user_id: number;
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  poster_path: string | null;
  media_type: string;
  season: number | null;
  episode: number | null;
  progress: number;
  watched_at: Date;
}

interface Favorite {
  id: number;
  user_id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
  added_at: Date;
}

const inMemoryData = {
  users: [] as User[],
  watchHistory: [] as WatchHistoryItem[],
  favorites: [] as Favorite[],
  settings: new Map<string, string>([
    ['m3u_url', 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8']
  ]),
};

export async function query(text: string, params?: unknown[]) {
  if (isOfflineMode) {
    console.warn('Database offline - using in-memory storage');
    return { rows: [], rowCount: 0 };
  }

  try {
    const result = await sql.query(text, params);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  if (isOfflineMode) {
    console.log('Running in offline mode - skipping database initialization');
    return;
  }

  try {
    // Criar tabela users
    await sql`
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
    `;

    // Criar tabela watch_history
    await sql`
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
    `;

    // Criar tabela favorites
    await sql`
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
    `;

    // Criar tabela system_settings
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `;

    // Criar tabela admin_logs
    await sql`
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
    `;

    // Inserir configuração padrão de M3U se não existir
    await sql`
      INSERT INTO system_settings (key, value, description)
      VALUES ('m3u_url', 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', 'URL da playlist M3U para TV ao vivo')
      ON CONFLICT (key) DO NOTHING
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export { sql, isOfflineMode, inMemoryData };
export type { User, WatchHistoryItem, Favorite };
