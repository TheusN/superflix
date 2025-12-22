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
 */
export function getPlayerUrl(type: 'movie' | 'tv', tmdbId: number, season?: number, episode?: number): string {
  const baseUrl = 'https://superflixapi.run';

  let playerUrl: string;
  if (type === 'movie') {
    playerUrl = `${baseUrl}/filme/${tmdbId}`;
  } else {
    playerUrl = `${baseUrl}/serie/${tmdbId}/${season}/${episode}`;
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
