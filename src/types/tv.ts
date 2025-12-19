export interface Channel {
  id: string;
  name: string;
  logo: string;
  country: string;
  category: string;
  url: string;
}

export interface M3UPlaylist {
  channels: Channel[];
  countries: string[];
  categories: string[];
}

export interface TVFilters {
  country: string;
  category: string;
  search: string;
}

export interface TVState {
  channels: Channel[];
  filteredChannels: Channel[];
  currentChannel: Channel | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  filters: TVFilters;
}

export interface M3UParseOptions {
  filterOffline?: boolean;
  filterHeaders?: boolean;
  defaultCountry?: string;
}
