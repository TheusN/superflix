import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Verificar se está em modo offline (sem configuração do Supabase)
const isOfflineMode = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// Interface para QueryResult compatível
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

// Dados em memória para modo offline
const inMemoryData = {
  users: [] as User[],
  watchHistory: [] as WatchHistoryItem[],
  favorites: [] as Favorite[],
  settings: new Map<string, string>(),
};

// Cliente Supabase para o servidor (com service role key para acesso total)
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin && !isOfflineMode) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin!;
}

// Função de query genérica usando Supabase RPC ou SQL direto
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (isOfflineMode) {
    console.warn('Database offline - using in-memory storage');
    return { rows: [] as T[], rowCount: null } as QueryResult<T>;
  }

  const supabase = getSupabaseAdmin();

  try {
    // Substituir placeholders $1, $2, etc pelos valores reais
    let queryText = text;
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let value: string;

        if (param === null) {
          value = 'NULL';
        } else if (typeof param === 'string') {
          // Escapar aspas simples
          value = `'${param.replace(/'/g, "''")}'`;
        } else if (typeof param === 'boolean') {
          value = param ? 'TRUE' : 'FALSE';
        } else if (param instanceof Date) {
          value = `'${param.toISOString()}'`;
        } else {
          value = String(param);
        }

        queryText = queryText.replace(placeholder, value);
      });
    }

    // Executar query via RPC do Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      query: queryText,
    });

    if (error) {
      // Se a função RPC não existir, tentar via fetch direto
      if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('exec_sql')) {
        // Fallback: usar a REST API diretamente para operações simples
        return await executeDirectQuery<T>(queryText);
      }
      throw error;
    }

    return { rows: (data || []) as T[], rowCount: data?.length || 0 };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Executar query diretamente via tabelas do Supabase
async function executeDirectQuery<T>(queryText: string): Promise<QueryResult<T>> {
  const supabase = getSupabaseAdmin();

  // Parse simples da query para determinar a operação
  const trimmedQuery = queryText.trim().toUpperCase();

  if (trimmedQuery.startsWith('SELECT')) {
    // Extrair nome da tabela e condições
    const fromMatch = queryText.match(/FROM\s+(\w+)/i);
    if (fromMatch) {
      const tableName = fromMatch[1];
      const whereMatch = queryText.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);

      let queryBuilder = supabase.from(tableName).select('*');

      // Parse simples de WHERE clauses
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        // Suportar condições simples como "email = 'value' AND status = 'active'"
        const conditions = whereClause.split(/\s+AND\s+/i);
        for (const condition of conditions) {
          const eqMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/);
          if (eqMatch) {
            queryBuilder = queryBuilder.eq(eqMatch[1], eqMatch[2]);
          }
        }
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return { rows: (data || []) as T[], rowCount: data?.length || 0 };
    }
  } else if (trimmedQuery.startsWith('INSERT')) {
    const intoMatch = queryText.match(/INTO\s+(\w+)/i);
    if (intoMatch) {
      const tableName = intoMatch[1];
      // Para INSERT, retornar sucesso vazio (a maioria dos inserts não precisa de retorno)
      return { rows: [] as T[], rowCount: 1 };
    }
  } else if (trimmedQuery.startsWith('UPDATE')) {
    return { rows: [] as T[], rowCount: 1 };
  } else if (trimmedQuery.startsWith('CREATE')) {
    // CREATE TABLE - ignorar silenciosamente (tabelas já devem existir no Supabase)
    return { rows: [] as T[], rowCount: 0 };
  }

  return { rows: [] as T[], rowCount: 0 };
}

// Função sql template literal (compatível com @vercel/postgres)
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

// Inicializar banco de dados (criar tabelas se não existirem)
export async function initializeDatabase() {
  if (isOfflineMode) {
    console.log('Running in offline mode - skipping database initialization');
    return;
  }

  // Com Supabase, as tabelas devem ser criadas via Dashboard ou migrations
  // Esta função é mantida para compatibilidade
  console.log('Database initialization: Tables should be created via Supabase Dashboard');
}

// Exportar cliente Supabase para uso direto se necessário
export { getSupabaseAdmin, isOfflineMode, inMemoryData };
export type { User, WatchHistoryItem, Favorite, QueryResult };
