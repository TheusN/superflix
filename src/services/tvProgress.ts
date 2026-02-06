/**
 * Servico de TV ao Vivo
 * Gerencia favoritos e historico de canais
 * Estrategia hibrida: localStorage + servidor
 */

import { STORAGE_KEYS } from '@/lib/constants';
import type { Channel } from '@/types/tv';

const TV_FAVORITES_KEY = 'superflix_tv_favorites';
const TV_HISTORY_KEY = 'superflix_tv_history';
const SYNC_DEBOUNCE = 5000; // 5 segundos

export interface TVFavorite {
  channel_id: string;
  channel_name: string;
  channel_logo: string | null;
  channel_category: string | null;
  added_at: number;
}

export interface TVHistoryItem {
  channel_id: string;
  channel_name: string;
  channel_logo: string | null;
  channel_category: string | null;
  watched_at: number;
}

// Cache em memoria
let favoritesCache: Map<string, TVFavorite> = new Map();
let historyCache: Map<string, TVHistoryItem> = new Map();
let syncFavoritesTimeout: NodeJS.Timeout | null = null;
let syncHistoryTimeout: NodeJS.Timeout | null = null;

// ==================== FAVORITOS ====================

// Carregar favoritos do localStorage
export function loadLocalFavorites(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TV_FAVORITES_KEY);
    if (stored) {
      const items: TVFavorite[] = JSON.parse(stored);
      favoritesCache.clear();
      items.forEach(item => {
        favoritesCache.set(item.channel_id, item);
      });
      return items.map(f => f.channel_id);
    }
  } catch (error) {
    console.error('Error loading TV favorites:', error);
  }
  return [];
}

// Salvar favoritos no localStorage
function saveFavoritesToLocalStorage() {
  if (typeof window === 'undefined') return;

  try {
    const items = Array.from(favoritesCache.values());
    localStorage.setItem(TV_FAVORITES_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving TV favorites:', error);
  }
}

// Verificar se canal e favorito
export function isFavorite(channelId: string): boolean {
  return favoritesCache.has(channelId);
}

// Obter lista de IDs favoritos
export function getFavoriteIds(): string[] {
  return Array.from(favoritesCache.keys());
}

// Obter favoritos completos
export function getFavorites(): TVFavorite[] {
  return Array.from(favoritesCache.values())
    .sort((a, b) => b.added_at - a.added_at);
}

// Adicionar favorito
export async function addFavorite(channel: Channel): Promise<void> {
  const favorite: TVFavorite = {
    channel_id: channel.id,
    channel_name: channel.name,
    channel_logo: channel.logo || null,
    channel_category: channel.category || null,
    added_at: Date.now(),
  };

  favoritesCache.set(channel.id, favorite);
  saveFavoritesToLocalStorage();
  scheduleSyncFavorites();
}

// Remover favorito
export async function removeFavorite(channelId: string): Promise<void> {
  favoritesCache.delete(channelId);
  saveFavoritesToLocalStorage();
  scheduleSyncFavorites();
}

// Toggle favorito
export async function toggleFavorite(channel: Channel): Promise<boolean> {
  if (isFavorite(channel.id)) {
    await removeFavorite(channel.id);
    return false;
  } else {
    await addFavorite(channel);
    return true;
  }
}

// Agendar sync de favoritos
function scheduleSyncFavorites() {
  if (syncFavoritesTimeout) {
    clearTimeout(syncFavoritesTimeout);
  }

  syncFavoritesTimeout = setTimeout(() => {
    syncFavoritesToServer();
  }, SYNC_DEBOUNCE);
}

// Sincronizar favoritos com servidor
export async function syncFavoritesToServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    // Buscar favoritos do servidor
    const response = await fetch('/api/tv/favorites', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const serverFavorites: TVFavorite[] = await response.json();

      // Merge: manter todos os favoritos (local + servidor)
      serverFavorites.forEach(sf => {
        if (!favoritesCache.has(sf.channel_id)) {
          favoritesCache.set(sf.channel_id, {
            ...sf,
            added_at: new Date(sf.added_at).getTime(),
          });
        }
      });

      // Enviar favoritos locais para o servidor
      const localFavorites = Array.from(favoritesCache.values());
      for (const fav of localFavorites) {
        await fetch('/api/tv/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(fav),
        });
      }

      saveFavoritesToLocalStorage();
    }
  } catch (error) {
    console.error('Error syncing TV favorites:', error);
  }
}

// Carregar favoritos do servidor
export async function loadFavoritesFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    const response = await fetch('/api/tv/favorites', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const serverFavorites: TVFavorite[] = await response.json();

      serverFavorites.forEach(sf => {
        favoritesCache.set(sf.channel_id, {
          ...sf,
          added_at: new Date(sf.added_at).getTime(),
        });
      });

      saveFavoritesToLocalStorage();
    }
  } catch (error) {
    console.error('Error loading TV favorites from server:', error);
  }
}

// ==================== HISTORICO ====================

// Carregar historico do localStorage
export function loadLocalHistory(): TVHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TV_HISTORY_KEY);
    if (stored) {
      const items: TVHistoryItem[] = JSON.parse(stored);
      historyCache.clear();
      items.forEach(item => {
        historyCache.set(item.channel_id, item);
      });
      return items;
    }
  } catch (error) {
    console.error('Error loading TV history:', error);
  }
  return [];
}

// Salvar historico no localStorage
function saveHistoryToLocalStorage() {
  if (typeof window === 'undefined') return;

  try {
    const items = Array.from(historyCache.values())
      .sort((a, b) => b.watched_at - a.watched_at)
      .slice(0, 20); // Manter apenas os 20 mais recentes
    localStorage.setItem(TV_HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving TV history:', error);
  }
}

// Obter historico
export function getHistory(): TVHistoryItem[] {
  return Array.from(historyCache.values())
    .sort((a, b) => b.watched_at - a.watched_at)
    .slice(0, 20);
}

// Adicionar ao historico
export function addToHistory(channel: Channel): void {
  const historyItem: TVHistoryItem = {
    channel_id: channel.id,
    channel_name: channel.name,
    channel_logo: channel.logo || null,
    channel_category: channel.category || null,
    watched_at: Date.now(),
  };

  historyCache.set(channel.id, historyItem);
  saveHistoryToLocalStorage();
  scheduleSyncHistory();
}

// Agendar sync de historico
function scheduleSyncHistory() {
  if (syncHistoryTimeout) {
    clearTimeout(syncHistoryTimeout);
  }

  syncHistoryTimeout = setTimeout(() => {
    syncHistoryToServer();
  }, SYNC_DEBOUNCE);
}

// Sincronizar historico com servidor
export async function syncHistoryToServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    const items = Array.from(historyCache.values());

    for (const item of items) {
      await fetch('/api/tv/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      });
    }
  } catch (error) {
    console.error('Error syncing TV history:', error);
  }
}

// Carregar historico do servidor
export async function loadHistoryFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  try {
    const response = await fetch('/api/tv/history', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const serverHistory: TVHistoryItem[] = await response.json();

      serverHistory.forEach(sh => {
        const existing = historyCache.get(sh.channel_id);
        const serverTime = new Date(sh.watched_at).getTime();

        // Manter o mais recente
        if (!existing || serverTime > existing.watched_at) {
          historyCache.set(sh.channel_id, {
            ...sh,
            watched_at: serverTime,
          });
        }
      });

      saveHistoryToLocalStorage();
    }
  } catch (error) {
    console.error('Error loading TV history from server:', error);
  }
}

// ==================== INICIALIZACAO ====================

// Inicializar servico
export function initTVService() {
  if (typeof window === 'undefined') return;

  // Carregar do localStorage
  loadLocalFavorites();
  loadLocalHistory();

  // Carregar do servidor com delay
  setTimeout(async () => {
    await loadFavoritesFromServer();
    await loadHistoryFromServer();
  }, 2000);

  // Sync ao sair da pagina
  window.addEventListener('beforeunload', () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      // Usar sendBeacon para historico - precisa de Blob para enviar JSON
      const historyItems = Array.from(historyCache.values()).slice(0, 5);
      if (historyItems.length > 0) {
        const data = JSON.stringify({ ...historyItems[0], token });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/tv/history', blob);
      }
    }
  });
}

// Cleanup
export function cleanupTVService() {
  if (syncFavoritesTimeout) clearTimeout(syncFavoritesTimeout);
  if (syncHistoryTimeout) clearTimeout(syncHistoryTimeout);
  syncFavoritesToServer();
  syncHistoryToServer();
}
