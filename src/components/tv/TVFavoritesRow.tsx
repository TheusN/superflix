'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Heart, ChevronLeft, ChevronRight, Tv, Play } from 'lucide-react';
import {
  getFavorites,
  loadLocalFavorites,
  loadFavoritesFromServer,
  removeFavorite,
  type TVFavorite,
} from '@/services/tvProgress';
import type { Channel } from '@/types/tv';

interface TVFavoritesRowProps {
  onSelectChannel?: (channel: Channel) => void;
}

export function TVFavoritesRow({ onSelectChannel }: TVFavoritesRowProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<TVFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    try {
      loadLocalFavorites();
      setFavorites(getFavorites());

      if (user) {
        await loadFavoritesFromServer();
        setFavorites(getFavorites());
      }
    } catch (error) {
      console.error('Error loading TV favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFavorite(channelId);
    setFavorites(getFavorites());
  };

  const handleSelectChannel = (fav: TVFavorite) => {
    if (onSelectChannel) {
      onSelectChannel({
        id: fav.channel_id,
        name: fav.channel_name,
        logo: fav.channel_logo || '',
        category: fav.channel_category || '',
        country: '',
        url: '',
      });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading || favorites.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Heart size={20} className="text-red-500" fill="currentColor" />
        <h2 className="text-xl font-semibold text-white">Canais Favoritos</h2>
        <span className="text-sm text-gray-500">({favorites.length})</span>
      </div>

      <div className="relative group">
        {/* Botao Scroll Esquerda */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hidden md:flex"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {favorites.map((fav) => (
            <div
              key={fav.channel_id}
              className="flex-shrink-0 w-36 md:w-44 group/card relative"
            >
              <button
                onClick={() => handleSelectChannel(fav)}
                className="w-full bg-[#1a1a1a] rounded-xl overflow-hidden hover:bg-[#252525] transition-all hover:scale-105"
              >
                {/* Badge LIVE */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Logo */}
                <div className="aspect-video flex items-center justify-center p-4 bg-gradient-to-br from-[#252525] to-[#1a1a1a]">
                  {fav.channel_logo ? (
                    <img
                      src={fav.channel_logo}
                      alt={fav.channel_name}
                      className="max-w-full max-h-full object-contain filter brightness-0 invert"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Tv size={32} className="text-gray-600" />
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Play size={24} className="text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <div className="p-3">
                  <p className="text-white text-sm font-medium truncate">{fav.channel_name}</p>
                  {fav.channel_category && (
                    <p className="text-gray-500 text-xs truncate">{fav.channel_category}</p>
                  )}
                </div>
              </button>

              {/* Botao Remover Favorito */}
              <button
                onClick={(e) => handleRemoveFavorite(fav.channel_id, e)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-red-600 transition-colors"
                title="Remover dos favoritos"
              >
                <Heart size={14} className="text-red-500 fill-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Botao Scroll Direita */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hidden md:flex"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
