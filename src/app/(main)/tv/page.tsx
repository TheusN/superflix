'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseM3U } from '@/services/m3u';
import { TVPlayer } from '@/components/player/TVPlayer';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Search, Tv, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Channel, TVFilters } from '@/types/tv';

export default function TVPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TVFilters>({
    search: '',
    country: '',
    category: '',
  });
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/m3u');
      const data = await response.json();

      if (data.url) {
        const m3uResponse = await fetch(data.url);
        const m3uText = await m3uResponse.text();
        const playlist = parseM3U(m3uText);
        setChannels(playlist.channels);

        if (playlist.channels.length > 0 && !selectedChannel) {
          setSelectedChannel(playlist.channels[0]);
        }
      } else {
        setError('Nenhuma playlist M3U configurada');
      }
    } catch (err) {
      console.error('Error loading channels:', err);
      setError('Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique countries and categories
  const { countries, categories } = useMemo(() => {
    const countrySet = new Set<string>();
    const categorySet = new Set<string>();

    channels.forEach((channel) => {
      if (channel.country) countrySet.add(channel.country);
      if (channel.category) categorySet.add(channel.category);
    });

    return {
      countries: Array.from(countrySet).sort(),
      categories: Array.from(categorySet).sort(),
    };
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesSearch =
        !filters.search ||
        channel.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCountry =
        !filters.country || channel.country === filters.country;
      const matchesCategory =
        !filters.category || channel.category === filters.category;

      return matchesSearch && matchesCountry && matchesCategory;
    });
  }, [channels, filters]);

  const countryOptions = [
    { value: '', label: 'Todos os Países' },
    ...countries.map((c) => ({ value: c, label: c })),
  ];

  const categoryOptions = [
    { value: '', label: 'Todas as Categorias' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300',
          showSidebar ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Canais</h2>
            <Button variant="ghost" size="sm" onClick={loadChannels}>
              <RefreshCw size={16} />
            </Button>
          </div>

          <Input
            placeholder="Buscar canal..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon={<Search size={18} />}
          />

          <Select
            options={countryOptions}
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          />

          <Select
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          />
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="secondary" size="sm" onClick={loadChannels}>
                Tentar novamente
              </Button>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)]">
              Nenhum canal encontrado
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {filteredChannels.map((channel, index) => (
                <button
                  key={`${channel.name}-${index}`}
                  onClick={() => setSelectedChannel(channel)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors',
                    'hover:bg-[var(--bg-tertiary)]',
                    selectedChannel?.url === channel.url && 'bg-[var(--accent-primary)]/10 border-l-2 border-[var(--accent-primary)]'
                  )}
                >
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-10 h-10 rounded object-contain bg-white/5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <Tv size={20} className="text-[var(--text-secondary)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {channel.name}
                    </p>
                    {channel.category && (
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {channel.category}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
          {filteredChannels.length} de {channels.length} canais
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-r-lg"
        style={{ left: showSidebar ? '320px' : '0' }}
      >
        {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Player Area */}
      <main className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <TVPlayer
              streamUrl={selectedChannel.url}
              channelName={selectedChannel.name}
              channelLogo={selectedChannel.logo}
              className="flex-1"
            />
            <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {selectedChannel.name}
              </h2>
              {selectedChannel.category && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedChannel.category}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Tv size={64} className="mx-auto mb-4 text-[var(--text-secondary)]" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Selecione um canal
              </h2>
              <p className="text-[var(--text-secondary)]">
                Escolha um canal na lista para começar a assistir
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
