'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, Star, Heart, Plus, Check } from 'lucide-react';
import type { Content } from '@/types/content';

interface ContentCardProps {
  content: Content;
  showType?: boolean;
  onPlay?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  inWatchlist?: boolean;
  className?: string;
}

export function ContentCard({
  content,
  showType = false,
  onPlay,
  onFavorite,
  isFavorite = false,
  inWatchlist = false,
  className,
}: ContentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const title = content.title || content.name || 'Sem título';
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = content.vote_average ? content.vote_average.toFixed(1) : null;
  const posterUrl = content.poster_path
    ? tmdb.getImageUrl(content.poster_path, 'w342')
    : '/placeholder-poster.jpg';

  const href = `/watch/${mediaType}/${content.id}`;

  const typeLabels: Record<string, string> = {
    movie: 'Filme',
    tv: 'Série',
    anime: 'Anime',
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden bg-[var(--bg-secondary)]',
        'transition-all duration-300 hover:scale-105 hover:z-10',
        className
      )}
    >
      <Link href={href} className="block">
        {/* Poster Image */}
        <div className="relative aspect-[2/3]">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-[var(--bg-tertiary)] animate-pulse" />
          )}
          <img
            src={posterUrl}
            alt={title}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 flex gap-2">
              {onFavorite && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onFavorite();
                  }}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  )}
                  aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
              <button
                onClick={(e) => e.preventDefault()}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  inWatchlist
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-black/50 text-white hover:bg-black/70'
                )}
                aria-label={inWatchlist ? 'Na lista' : 'Adicionar à lista'}
              >
                {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
              </button>
            </div>

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={(e) => {
                  if (onPlay) {
                    e.preventDefault();
                    onPlay();
                  }
                }}
                className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300"
                aria-label="Assistir"
              >
                <Play size={24} fill="currentColor" />
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-semibold text-white line-clamp-2 text-sm">{title}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
                {rating && (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400" fill="currentColor" />
                    {rating}
                  </span>
                )}
                {year && <span>{year}</span>}
              </div>
            </div>
          </div>

          {/* Type Badge */}
          {showType && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 text-xs font-medium bg-[var(--accent-primary)] text-white rounded">
                {typeLabels[mediaType] || mediaType}
              </span>
            </div>
          )}

          {/* Rating Badge (always visible) */}
          {rating && (
            <div className="absolute bottom-2 left-2 opacity-100 group-hover:opacity-0 transition-opacity">
              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                <Star size={12} className="text-yellow-400" fill="currentColor" />
                {rating}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Title (below image, visible on mobile) */}
      <div className="p-2 md:hidden">
        <h3 className="font-medium text-[var(--text-primary)] line-clamp-1 text-sm">{title}</h3>
        {year && <p className="text-xs text-[var(--text-secondary)]">{year}</p>}
      </div>
    </div>
  );
}
