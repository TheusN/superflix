'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { History, ChevronLeft, ChevronRight, Tv, Play } from 'lucide-react';
import {
  getHistory,
  loadLocalHistory,
  loadHistoryFromServer,
  type TVHistoryItem,
} from '@/services/tvProgress';
import type { Channel } from '@/types/tv';

interface TVRecentlyWatchedRowProps {
  onSelectChannel?: (channel: Channel) => void;
}

export function TVRecentlyWatchedRow({ onSelectChannel }: TVRecentlyWatchedRowProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<TVHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      loadLocalHistory();
      setHistory(getHistory());

      if (user) {
        await loadHistoryFromServer();
        setHistory(getHistory());
      }
    } catch (error) {
      console.error('Error loading TV history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChannel = (item: TVHistoryItem) => {
    if (onSelectChannel) {
      onSelectChannel({
        id: item.channel_id,
        name: item.channel_name,
        logo: item.channel_logo || '',
        category: item.channel_category || '',
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

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atras`;
    if (hours < 24) return `${hours}h atras`;
    if (days === 1) return 'Ontem';
    return `${days} dias atras`;
  };

  if (isLoading || history.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Assistidos Recentemente</h2>
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
          {history.map((item, index) => (
            <div
              key={`${item.channel_id}-${index}`}
              className="flex-shrink-0 w-36 md:w-44 group/card relative"
            >
              <button
                onClick={() => handleSelectChannel(item)}
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
                  {item.channel_logo ? (
                    <img
                      src={item.channel_logo}
                      alt={item.channel_name}
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
                  <p className="text-white text-sm font-medium truncate">{item.channel_name}</p>
                  <p className="text-gray-500 text-xs">{formatTimeAgo(item.watched_at)}</p>
                </div>
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
