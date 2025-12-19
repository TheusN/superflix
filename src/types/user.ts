export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  status?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface WatchHistoryItem {
  id: number;
  user_id: number;
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  progress: number;
  watched_at: string;
}

export interface FavoriteItem {
  id: number;
  user_id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  added_at: string;
}

export interface ContinueWatchingItem extends WatchHistoryItem {
  remaining_time?: number;
}

export interface UserProfile extends User {
  watchHistory: WatchHistoryItem[];
  favorites: FavoriteItem[];
  continueWatching: ContinueWatchingItem[];
}

export interface ProfileUpdateData {
  name: string;
}
