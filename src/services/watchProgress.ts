/**
 * Servico de Progresso de Visualizacao
 *
 * Estrategia hibrida localStorage + servidor:
 * - Salva localmente a cada 10 segundos (rapido, sem latencia)
 * - Sincroniza com servidor a cada 60 segundos (debounced)
 * - Sincroniza ao sair da pagina (beforeunload)
 * - Merge inteligente: maior progresso vence
 */

import { STORAGE_KEYS } from '@/lib/constants';

export interface WatchProgressItem {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  progress: number; // 0.0 a 1.0
  updated_at: number; // timestamp
}

const STORAGE_KEY = STORAGE_KEYS.history || 'superflix_history';
const SYNC_INTERVAL = 60000; // 60 segundos
const LOCAL_SAVE_INTERVAL = 10000; // 10 segundos

// Cache em memoria
let progressCache: Map<string, WatchProgressItem> = new Map();
let syncTimeout: NodeJS.Timeout | null = null;
let pendingSync = false;

// Gerar chave unica para cada item
function getItemKey(item: { tmdb_id: number; season?: number | null; episode?: number | null }): string {
  if (item.season && item.episode) {
    return `${item.tmdb_id}-s${item.season}-e${item.episode}`;
  }
  return `${item.tmdb_id}`;
}

// Carregar do localStorage
export function loadLocalProgress(): Map<string, WatchProgressItem> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const items: WatchProgressItem[] = JSON.parse(stored);
      const map = new Map<string, WatchProgressItem>();
      items.forEach(item => {
        map.set(getItemKey(item), item);
      });
      progressCache = map;
      return map;
    }
  } catch (error) {
    console.error('Error loading local progress:', error);
  }
  return new Map();
}

// Salvar no localStorage
function saveToLocalStorage() {
  if (typeof window === 'undefined') return;

  try {
    const items = Array.from(progressCache.values());
    // Manter apenas os ultimos 100 itens
    const sorted = items.sort((a, b) => b.updated_at - a.updated_at).slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Salvar progresso localmente (chamado frequentemente)
export function saveProgressLocal(item: Omit<WatchProgressItem, 'updated_at'>) {
  const key = getItemKey(item);
  const existing = progressCache.get(key);

  // So atualizar se o progresso for maior ou nao existir
  if (!existing || item.progress > existing.progress) {
    progressCache.set(key, {
      ...item,
      updated_at: Date.now(),
    });
    saveToLocalStorage();
    scheduleSyncToServer();
  }
}

// Agendar sincronizacao com servidor (debounced)
function scheduleSyncToServer() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  pendingSync = true;

  syncTimeout = setTimeout(() => {
    syncToServer();
  }, SYNC_INTERVAL);
}

// Sincronizar com servidor
export async function syncToServer(force = false): Promise<void> {
  if (!pendingSync && !force) return;
  if (typeof window === 'undefined') return;

  // Verificar se usuario esta logado
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    const items = Array.from(progressCache.values())
      .filter(item => item.progress > 0)
      .map(item => ({
        tmdb_id: item.tmdb_id,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type,
        season: item.season,
        episode: item.episode,
        progress: item.progress,
      }));

    if (items.length === 0) return;

    const response = await fetch('/api/history/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });

    if (response.ok) {
      pendingSync = false;
      console.log('[WatchProgress] Synced to server:', items.length, 'items');
    }
  } catch (error) {
    console.error('[WatchProgress] Sync error:', error);
  }
}

// Carregar do servidor e fazer merge com local
export async function loadFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    const response = await fetch('/api/history/continue', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const serverItems: WatchProgressItem[] = await response.json();

      // Merge: maior progresso vence
      serverItems.forEach(serverItem => {
        const key = getItemKey(serverItem);
        const localItem = progressCache.get(key);

        if (!localItem || serverItem.progress > localItem.progress) {
          progressCache.set(key, {
            ...serverItem,
            updated_at: new Date(serverItem.updated_at).getTime(),
          });
        }
      });

      saveToLocalStorage();
    }
  } catch (error) {
    console.error('[WatchProgress] Load from server error:', error);
  }
}

// Obter progresso de um item
export function getProgress(tmdbId: number, season?: number | null, episode?: number | null): number {
  const key = getItemKey({ tmdb_id: tmdbId, season, episode });
  return progressCache.get(key)?.progress || 0;
}

// Obter todos os itens em andamento
export function getContinueWatching(): WatchProgressItem[] {
  return Array.from(progressCache.values())
    .filter(item => item.progress > 0 && item.progress < 0.95)
    .sort((a, b) => b.updated_at - a.updated_at)
    .slice(0, 20);
}

// Marcar como concluido
export function markAsCompleted(item: Omit<WatchProgressItem, 'updated_at' | 'progress'>) {
  saveProgressLocal({ ...item, progress: 0.95 });
}

// Inicializar - chamar ao carregar a pagina
export function initWatchProgress() {
  if (typeof window === 'undefined') return;

  // Carregar do localStorage
  loadLocalProgress();

  // Sincronizar ao fechar pagina
  window.addEventListener('beforeunload', () => {
    if (pendingSync) {
      // Usar sendBeacon para garantir que seja enviado
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        const items = Array.from(progressCache.values())
          .filter(item => item.progress > 0)
          .map(item => ({
            tmdb_id: item.tmdb_id,
            title: item.title,
            poster_path: item.poster_path,
            media_type: item.media_type,
            season: item.season,
            episode: item.episode,
            progress: item.progress,
          }));

        if (items.length > 0) {
          navigator.sendBeacon(
            '/api/history/sync',
            JSON.stringify({ items, token })
          );
        }
      }
    }
  });

  // Carregar do servidor e fazer merge (com delay para nao bloquear)
  setTimeout(() => {
    loadFromServer();
  }, 2000);
}

// Cleanup
export function cleanupWatchProgress() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncToServer(true);
}
