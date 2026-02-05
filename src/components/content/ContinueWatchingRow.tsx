'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { getContinueWatching, loadLocalProgress, loadFromServer, type WatchProgressItem } from '@/services/watchProgress';

export function ContinueWatchingRow() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContinueWatching();
  }, [user]);

  const loadContinueWatching = async () => {
    try {
      // Carregar do localStorage primeiro (rapido)
      loadLocalProgress();
      setItems(getContinueWatching());

      // Se logado, sincronizar com servidor
      if (user) {
        await loadFromServer();
        setItems(getContinueWatching());
      }
    } catch (error) {
      console.error('Error loading continue watching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Nao mostrar se nao tiver itens
  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 md:px-12 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          Continuar Assistindo
        </h2>
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
          {items.map((item) => (
            <ContinueWatchingCard key={`${item.tmdb_id}-${item.season}-${item.episode}`} item={item} />
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

function ContinueWatchingCard({ item }: { item: WatchProgressItem }) {
  const posterUrl = item.poster_path
    ? tmdb.getImageUrl(item.poster_path, 'w342')
    : '/placeholder-poster.jpg';

  const watchUrl = item.media_type === 'movie'
    ? `/watch/movie/${item.tmdb_id}`
    : `/watch/tv/${item.tmdb_id}?s=${item.season || 1}&e=${item.episode || 1}`;

  const progressPercent = Math.round((item.progress || 0) * 100);

  return (
    <Link
      href={watchUrl}
      className="flex-shrink-0 w-40 md:w-48 group/card"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        <img
          src={posterUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
        />

        {/* Overlay com Play */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={28} className="text-black ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-green-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Badge de Episodio */}
        {item.media_type === 'tv' && item.season && item.episode && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
            S{item.season}:E{item.episode}
          </div>
        )}
      </div>

      <div className="mt-2">
        <h3 className="text-white text-sm font-medium line-clamp-1 group-hover/card:text-green-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {progressPercent}% assistido
        </p>
      </div>
    </Link>
  );
}
