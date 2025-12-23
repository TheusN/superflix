/**
 * Serviço de Proxy para contornar bloqueios de rede
 * Usa o DNS do Cloudflare (1.1.1.1) através do servidor
 */

// Verificar se devemos usar proxy (pode ser configurado por env)
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY !== 'false';

/**
 * Gera URL do proxy para um recurso externo
 */
export function getProxyUrl(url: string): string {
  if (!USE_PROXY) return url;

  // Codificar a URL para passar como parâmetro
  const encodedUrl = encodeURIComponent(url);
  return `/api/proxy?url=${encodedUrl}`;
}

/**
 * Gera URL do proxy para embeds (iframes)
 */
export function getEmbedProxyUrl(url: string): string {
  if (!USE_PROXY) return url;

  const encodedUrl = encodeURIComponent(url);
  return `/api/proxy/embed?url=${encodedUrl}`;
}

/**
 * Gera URL do player SuperflixAPI com proxy
 * Filmes: usam IMDb ID (formato: tt1234567)
 * Séries: usam TMDB ID
 */
export function getPlayerUrl(type: 'movie' | 'tv', id: string | number, season?: number, episode?: number): string {
  const baseUrl = 'https://superflixapi.buzz';

  let playerUrl: string;
  if (type === 'movie') {
    // Filmes precisam do IMDb ID
    playerUrl = `${baseUrl}/filme/${id}`;
  } else {
    // Séries usam TMDB ID
    playerUrl = `${baseUrl}/serie/${id}/${season}/${episode}`;
  }

  // Para o player, usamos o proxy de embed
  return USE_PROXY ? getEmbedProxyUrl(playerUrl) : playerUrl;
}

/**
 * Gera URL do player de TV com proxy
 */
export function getTVPlayerUrl(channelId: string): string {
  const playerUrl = `https://embedtv.best/player.php?id=${channelId}`;
  return USE_PROXY ? getEmbedProxyUrl(playerUrl) : playerUrl;
}

/**
 * Fetch com proxy automático
 */
export async function proxyFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!USE_PROXY) {
    return fetch(url, options);
  }

  const proxyUrl = getProxyUrl(url);
  return fetch(proxyUrl, options);
}
