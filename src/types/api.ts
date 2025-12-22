export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface ApiError {
  error: string;
  status: number;
  details?: unknown;
}

// Admin types
export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  watchesToday: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalWatchHistory: number;
}

export interface AdminSettings {
  site_name: string;
  maintenance_mode: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  status: string;
  last_login: string | null;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin_id: number;
  admin_email?: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
  updated_by: number | null;
}

// Request/Response types
export interface HistoryRequest {
  tmdb_id: number;
  imdb_id?: string;
  title: string;
  poster_path?: string;
  media_type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  progress?: number;
}

export interface FavoriteRequest {
  tmdb_id: number;
  title: string;
  poster_path?: string;
  media_type: 'movie' | 'tv';
}

export interface SyncHistoryRequest {
  items: HistoryRequest[];
}
