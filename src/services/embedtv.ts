import type { Channel } from '@/types/tv';

interface EmbedTVCategory {
  id: number;
  name: string;
}

interface EmbedTVChannel {
  id: string;
  name: string;
  image: string;
  categories: number[];
  url: string;
}

interface EmbedTVResponse {
  categories: EmbedTVCategory[];
  channels: EmbedTVChannel[];
}

// Cache para evitar requests desnecessários
let cachedData: { channels: Channel[]; categories: string[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

export async function fetchEmbedTVChannels(): Promise<{ channels: Channel[]; categories: string[] }> {
  // Retornar cache se ainda válido
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  // Usar API route interna para evitar CORS
  const response = await fetch('/api/tv/channels');

  if (!response.ok) {
    throw new Error(`Erro ao carregar canais: ${response.status}`);
  }

  const data: EmbedTVResponse = await response.json();

  // Criar mapa de categorias
  const categoryMap = new Map<number, string>();
  data.categories.forEach(cat => {
    categoryMap.set(cat.id, cat.name);
  });

  // Converter para formato interno
  const channels: Channel[] = data.channels.map(ch => {
    // Pegar a categoria principal (excluindo "Todos" que é id 0)
    const categoryIds = ch.categories.filter(id => id !== 0);
    const category = categoryIds.length > 0
      ? categoryMap.get(categoryIds[0]) || 'Outros'
      : 'Outros';

    return {
      id: ch.id,
      name: ch.name,
      logo: ch.image,
      country: 'Brasil',
      category,
      url: ch.url,
    };
  });

  // Extrair categorias únicas (excluindo "Todos")
  const categories = data.categories
    .filter(cat => cat.id !== 0)
    .map(cat => cat.name)
    .sort();

  cachedData = { channels, categories };
  cacheTime = Date.now();

  return { channels, categories };
}

export function getEmbedPlayerUrl(channelId: string): string {
  return `https://embedtv.best/player.php?id=${channelId}`;
}

export function clearEmbedTVCache(): void {
  cachedData = null;
  cacheTime = 0;
}
