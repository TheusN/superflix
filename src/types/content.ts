export interface Content {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
  adult?: boolean;
  original_language?: string;
}

export interface ContentDetails extends Content {
  genres: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  status: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  videos?: {
    results: Video[];
  };
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  similar?: {
    results: Content[];
  };
  external_ids?: ExternalIds;
  // TV specific
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  networks?: Network[];
  created_by?: Creator[];
  last_air_date?: string;
  in_production?: boolean;
  next_episode_to_air?: Episode | null;
  last_episode_to_air?: Episode | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface ExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
}

export interface SeasonDetails extends Season {
  episodes: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Creator {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface SearchResult extends Omit<Content, 'media_type'> {
  media_type: 'movie' | 'tv' | 'person';
}
