import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE, CACHE_TTL } from '@/lib/constants';
import type { Content, ContentDetails, SeasonDetails, TMDBResponse, SearchResult } from '@/types/content';

// Cache em memória com TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const response = await fetch(url, { next: { revalidate: 600 } });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

export const tmdb = {
  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return '/icons/icon-192.png';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  async getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week'
  ): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getPopular(mediaType: 'movie' | 'tv', page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getTopRated(mediaType: 'movie' | 'tv', page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getNowPlaying(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getUpcoming(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getOnTheAir(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getDetails(mediaType: 'movie' | 'tv', id: number): Promise<ContentDetails> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,credits,similar,external_ids`;
    return fetchWithCache<ContentDetails>(url);
  },

  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<SeasonDetails> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    return fetchWithCache<SeasonDetails>(url);
  },

  async search(query: string, page: number = 1): Promise<TMDBResponse<SearchResult>> {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<SearchResult>>(url);
  },

  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async searchTv(query: string, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getGenres(mediaType: 'movie' | 'tv'): Promise<{ genres: { id: number; name: string }[] }> {
    const url = `${TMDB_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}&language=pt-BR`;
    return fetchWithCache(url);
  },

  async discoverByGenre(
    mediaType: 'movie' | 'tv',
    genreId: number,
    page: number = 1
  ): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async discover(
    mediaType: 'movie' | 'tv',
    options: {
      page?: number;
      sort_by?: string;
      with_genres?: string;
    } = {}
  ): Promise<TMDBResponse<Content>> {
    const { page = 1, sort_by = 'popularity.desc', with_genres } = options;
    let url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}&sort_by=${sort_by}`;
    if (with_genres) {
      url += `&with_genres=${with_genres}`;
    }
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getAnime(page: number = 1, sortBy: string = 'popularity.desc'): Promise<TMDBResponse<Content>> {
    // Animes são séries japonesas de animação (genre_id: 16 = Animation, origin_country: JP)
    const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=${sortBy}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getSimilar(mediaType: 'movie' | 'tv', id: number, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/similar?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getRecommendations(mediaType: 'movie' | 'tv', id: number, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getExternalIds(mediaType: 'movie' | 'tv', id: number): Promise<{ imdb_id: string | null }> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/external_ids?api_key=${TMDB_API_KEY}`;
    return fetchWithCache(url);
  },

  // Helper to get title regardless of media type
  getTitle(content: Content): string {
    return content.title || content.name || 'Sem título';
  },

  // Helper to get release date regardless of media type
  getReleaseDate(content: Content): string | undefined {
    return content.release_date || content.first_air_date;
  },

  // Helper to get year from content
  getYear(content: Content): string {
    const date = this.getReleaseDate(content);
    return date ? new Date(date).getFullYear().toString() : '';
  },
};

export const superflixApi = {
  // URL base sem proxy
  // Filmes: usam IMDb ID (formato: tt1234567)
  // Séries: usam TMDB ID
  getDirectUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number): string {
    const baseUrl = 'https://superflixapi.buzz';
    if (type === 'movie') {
      // Filmes precisam do IMDb ID com prefixo 'tt'
      // Se já tem 'tt', usa diretamente; senão, assume que é TMDB ID e não vai funcionar
      return `${baseUrl}/filme/${id}`;
    }
    // Séries usam TMDB ID
    return `${baseUrl}/serie/${id}/${season}/${episode}`;
  },

  // URL com proxy para contornar bloqueios
  getPlayerUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number, useProxy = true): string {
    const directUrl = this.getDirectUrl(type, id, season, episode);

    if (useProxy) {
      return `/api/proxy/embed?url=${encodeURIComponent(directUrl)}`;
    }

    return directUrl;
  },

  getEmbedUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number): string {
    return this.getPlayerUrl(type, id, season, episode);
  },
};
