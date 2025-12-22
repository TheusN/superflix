'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchEmbedTVChannels, clearEmbedTVCache } from '@/services/embedtv';
import { TVEmbedPlayer } from '@/components/player/TVEmbedPlayer';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Search, Tv, RefreshCw, ChevronLeft, ChevronRight, X, Menu } from 'lucide-react';
import type { Channel, TVFilters } from '@/types/tv';

export default function TVPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TVFilters>({
    search: '',
    category: '',
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        clearEmbedTVCache();
      }

      const data = await fetchEmbedTVChannels();
      setChannels(data.channels);
      setCategories(data.categories);

      if (data.channels.length > 0 && !selectedChannel) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (err) {
      console.error('Error loading channels:', err);
      setError('Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  // Selecionar canal e fechar sidebar no mobile
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesSearch =
        !filters.search ||
        channel.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory =
        !filters.category || channel.category === filters.category;

      return matchesSearch && matchesCategory;
    });
  }, [channels, filters]);

  const categoryOptions = [
    { value: '', label: 'Todas as Categorias' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] bg-[var(--bg-primary)] relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="flex items-center gap-2 text-[var(--text-primary)]"
        >
          <Menu size={20} />
          <span className="text-sm font-medium">
            {selectedChannel ? selectedChannel.name : 'Selecionar Canal'}
          </span>
        </button>
        <Button variant="ghost" size="sm" onClick={() => loadChannels(true)}>
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Sidebar - Desktop: fixa, Mobile: overlay */}
      <aside
        className={cn(
          'flex flex-col bg-[var(--bg-secondary)] transition-all duration-300 z-20',
          // Mobile: overlay fullscreen
          'md:relative md:border-r md:border-[var(--border-color)]',
          isMobile
            ? showSidebar
              ? 'fixed inset-0 top-[calc(4rem+52px)]'
              : 'hidden'
            : showSidebar
              ? 'w-80'
              : 'w-0 overflow-hidden'
        )}
      >
        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Canais</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => loadChannels(true)} className="hidden md:flex">
                <RefreshCw size={16} />
              </Button>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <Input
            placeholder="Buscar canal..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon={<Search size={18} />}
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
              <Button variant="secondary" size="sm" onClick={() => loadChannels()}>
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
                  key={`${channel.id}-${index}`}
                  onClick={() => handleSelectChannel(channel)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors',
                    'hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)]',
                    selectedChannel?.id === channel.id && 'bg-[var(--accent-primary)]/10 border-l-2 border-[var(--accent-primary)]'
                  )}
                >
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-10 h-10 rounded object-contain bg-white/5 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
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

      {/* Toggle Sidebar Button - Desktop only */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={cn(
          'hidden md:block absolute top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-r-lg transition-all',
          showSidebar ? 'left-80' : 'left-0'
        )}
      >
        {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Player Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {selectedChannel ? (
          <>
            <TVEmbedPlayer
              channelId={selectedChannel.id}
              channelName={selectedChannel.name}
              channelLogo={selectedChannel.logo}
              className="flex-1 min-h-[200px] md:min-h-0"
            />
            <div className="p-3 md:p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">
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
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <Tv size={48} className="mx-auto mb-4 text-[var(--text-secondary)] md:w-16 md:h-16" />
              <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-2">
                Selecione um canal
              </h2>
              <p className="text-sm md:text-base text-[var(--text-secondary)]">
                {isMobile ? 'Toque no menu acima para ver os canais' : 'Escolha um canal na lista para começar a assistir'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Overlay backdrop para mobile */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-10"
          style={{ top: 'calc(4rem + 52px)' }}
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
