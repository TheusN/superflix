import { Pool, PoolClient } from 'pg';

// URL de conexao do PostgreSQL
const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Verificar se esta em modo offline (sem configuracao do banco)
const isOfflineMode = !DATABASE_URL;

// Interface para QueryResult compativel
interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
}

// Interfaces
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

// Dados em memoria para modo offline
const inMemoryData = {
  users: [] as User[],
  watchHistory: [] as WatchHistoryItem[],
  favorites: [] as Favorite[],
  settings: new Map<string, string>(),
};

// Pool de conexoes PostgreSQL
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool && !isOfflineMode) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Log de erros do pool
    pool.on('error', (err) => {
      console.error('Erro inesperado no pool do PostgreSQL:', err);
    });
  }
  return pool!;
}

// Funcao de query generica usando pg
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (isOfflineMode) {
    console.warn('Database offline - using in-memory storage');
    return { rows: [] as T[], rowCount: null } as QueryResult<T>;
  }

  const client = getPool();

  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Funcao sql template literal (compativel com @vercel/postgres)
export async function sql<T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<QueryResult<T>> {
  if (isOfflineMode) {
    console.warn('Database offline - using in-memory storage');
    return { rows: [] as T[], rowCount: null } as QueryResult<T>;
  }

  // Converter template literal para query parametrizada
  let queryText = '';
  const params: unknown[] = [];

  strings.forEach((string, i) => {
    queryText += string;
    if (i < values.length) {
      params.push(values[i]);
      queryText += `$${params.length}`;
    }
  });

  return query<T>(queryText, params);
}

// Obter uma conexao do pool para transacoes
export async function getClient(): Promise<PoolClient> {
  if (isOfflineMode) {
    throw new Error('Database offline - cannot get client');
  }
  return getPool().connect();
}

// Inicializar banco de dados (criar tabelas se nao existirem)
export async function initializeDatabase() {
  if (isOfflineMode) {
    console.log('Running in offline mode - skipping database initialization');
    return;
  }

  const client = await getClient();

  try {
    // Criar tabelas
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL,
        imdb_id VARCHAR(50),
        title VARCHAR(500) NOT NULL,
        poster_path VARCHAR(500),
        media_type VARCHAR(50) NOT NULL,
        season INTEGER,
        episode INTEGER,
        progress DECIMAL(5,4) DEFAULT 0,
        watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tmdb_id, season, episode)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL,
        title VARCHAR(500) NOT NULL,
        poster_path VARCHAR(500),
        media_type VARCHAR(50) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tmdb_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        target_type VARCHAR(100),
        target_id VARCHAR(100),
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar indices se nao existirem
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_watch_history_tmdb_id ON watch_history(tmdb_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_tmdb_id ON favorites(tmdb_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at)`);

    console.log('Database tables initialized successfully');
  } finally {
    client.release();
  }
}

// Fechar pool de conexoes (para cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Exportar para uso externo
export { isOfflineMode, inMemoryData, getPool };
export type { User, WatchHistoryItem, Favorite, QueryResult };
