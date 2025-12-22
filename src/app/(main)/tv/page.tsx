'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchEmbedTVChannels, getEmbedPlayerUrl, clearEmbedTVCache } from '@/services/embedtv';
import { cn } from '@/lib/utils';
import { Search, Heart, Calendar, ChevronLeft, ChevronRight, RefreshCw, X, ArrowLeft, Tv } from 'lucide-react';
import type { Channel } from '@/types/tv';

type TabType = 'channels' | 'favorites' | 'schedule';

export default function TVPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Resetar estado do player quando mudar de canal
  const selectChannel = (channel: Channel | null) => {
    setIsPlayerReady(false);
    setSelectedChannel(channel);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tv-favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Salvar favoritos
  const toggleFavorite = (channelId: string) => {
    const newFavorites = favorites.includes(channelId)
      ? favorites.filter(id => id !== channelId)
      : [...favorites, channelId];
    setFavorites(newFavorites);
    localStorage.setItem('tv-favorites', JSON.stringify(newFavorites));
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (forceRefresh) clearEmbedTVCache();
      const data = await fetchEmbedTVChannels();
      setChannels(data.channels);
      setCategories(['Todos', ...data.categories]);
    } catch (err) {
      console.error('Error loading channels:', err);
      setError('Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar canais
  const filteredChannels = useMemo(() => {
    let result = channels;

    // Filtrar por favoritos
    if (activeTab === 'favorites') {
      result = result.filter(ch => favorites.includes(ch.id));
    }

    // Filtrar por busca
    if (searchQuery) {
      result = result.filter(ch =>
        ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por categoria
    if (activeCategory !== 'Todos') {
      result = result.filter(ch => ch.category === activeCategory);
    }

    return result;
  }, [channels, searchQuery, activeCategory, activeTab, favorites]);

  // Agrupar por categoria para desktop
  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, Channel[]> = {};
    filteredChannels.forEach(ch => {
      const cat = ch.category || 'Outros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ch);
    });
    return grouped;
  }, [filteredChannels]);

  // Se um canal está selecionado, mostrar o player
  if (selectedChannel) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header do Player */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <button
            onClick={() => selectChannel(null)}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Voltar</span>
          </button>
        </div>

        {/* Player */}
        <div className="w-full h-screen relative">
          {/* Loading overlay */}
          {!isPlayerReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white text-lg">Carregando {selectedChannel.name}...</p>
              <p className="text-gray-500 text-sm mt-2">Aguarde ou clique no player para iniciar</p>
            </div>
          )}
          <iframe
            src={getEmbedPlayerUrl(selectedChannel.id)}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 'none', background: 'black' }}
            onLoad={() => {
              // Dar um tempo para o player interno carregar
              setTimeout(() => setIsPlayerReady(true), 2000);
            }}
          />
        </div>

        {/* Info do Canal */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="flex items-center gap-3">
            {selectedChannel.logo && (
              <img
                src={selectedChannel.logo}
                alt={selectedChannel.name}
                className="w-12 h-12 rounded-lg object-contain bg-white/10"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                  AO VIVO
                </span>
              </div>
              <h2 className="text-white text-lg font-semibold mt-1">
                {selectedChannel.name}
              </h2>
              {selectedChannel.category && (
                <p className="text-gray-400 text-sm">{selectedChannel.category}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Página de listagem de canais
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header Mobile */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
          {/* Título e LIVE */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Tv size={24} className="text-white" />
              <h1 className="text-xl font-bold text-white">TV ao Vivo</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadChannels(true)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <RefreshCw size={20} />
              </button>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('channels')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'channels'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-500'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Tv size={16} />
                Canais
              </div>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'favorites'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-500'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart size={16} />
                Favoritos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'schedule'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-500'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                Programação
              </div>
            </button>
          </div>

          {/* Busca */}
          <div className="p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar canal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filtros de Categoria */}
          <div className="px-4 pb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header Desktop */}
      {!isMobile && (
        <div className="px-8 py-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white">TV Ao Vivo</h1>
            <button
              onClick={() => loadChannels(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
          <p className="text-gray-400 text-lg">
            Esportes, Notícias e seus canais favoritos em tempo real.
          </p>

          {/* Busca Desktop */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar canal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className={cn('pb-20', isMobile ? 'px-4' : 'px-8')}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadChannels()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : activeTab === 'schedule' ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-semibold text-white mb-2">Em breve</h2>
            <p className="text-gray-500">A programação estará disponível em breve.</p>
          </div>
        ) : isMobile ? (
          /* Grid Mobile 2x2 */
          <div className="grid grid-cols-2 gap-3">
            {filteredChannels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isFavorite={favorites.includes(channel.id)}
                onSelect={() => selectChannel(channel)}
                onToggleFavorite={() => toggleFavorite(channel.id)}
              />
            ))}
          </div>
        ) : (
          /* Carrosséis Desktop por Categoria */
          <div className="space-y-10">
            {searchQuery ? (
              /* Resultados de busca */
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Resultados para "{searchQuery}"
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredChannels.map(channel => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isFavorite={favorites.includes(channel.id)}
                      onSelect={() => selectChannel(channel)}
                      onToggleFavorite={() => toggleFavorite(channel.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Por categoria */
              Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
                <CategoryRow
                  key={category}
                  title={category}
                  channels={categoryChannels}
                  favorites={favorites}
                  onSelectChannel={selectChannel}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Mobile com Stats */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredChannels.length} canais disponíveis
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Heart size={14} className="text-red-500" />
              {favorites.length} favoritos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Card do Canal
function ChannelCard({
  channel,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  channel: Channel;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className="w-full bg-[#1a1a1a] rounded-xl overflow-hidden hover:bg-[#252525] transition-colors"
      >
        {/* Badge LIVE */}
        <div className="absolute top-2 left-2 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Logo */}
        <div className="aspect-video flex items-center justify-center p-4 bg-[#252525]">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="max-w-full max-h-full object-contain filter brightness-0 invert"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv size={32} className="text-gray-600" />
          )}
        </div>

        {/* Nome */}
        <div className="p-3">
          <p className="text-white text-sm font-medium truncate">{channel.name}</p>
        </div>
      </button>

      {/* Botão Favorito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <Heart
          size={16}
          className={cn(
            'transition-colors',
            isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
          )}
        />
      </button>
    </div>
  );
}

// Componente de Linha de Categoria (Desktop)
function CategoryRow({
  title,
  channels,
  favorites,
  onSelectChannel,
  onToggleFavorite,
}: {
  title: string;
  channels: Channel[];
  favorites: string[];
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="relative group/row">
        {/* Botão Scroll Esquerda */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {channels.map(channel => (
            <div key={channel.id} className="flex-shrink-0 w-48">
              <ChannelCard
                channel={channel}
                isFavorite={favorites.includes(channel.id)}
                onSelect={() => onSelectChannel(channel)}
                onToggleFavorite={() => onToggleFavorite(channel.id)}
              />
            </div>
          ))}
        </div>

        {/* Botão Scroll Direita */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
