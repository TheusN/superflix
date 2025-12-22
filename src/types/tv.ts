export interface Channel {
  id: string;
  name: string;
  logo: string;
  country: string;
  category: string;
  url: string;
}

export interface TVFilters {
  category: string;
  search: string;
  country?: string; // Mantido para compatibilidade
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
