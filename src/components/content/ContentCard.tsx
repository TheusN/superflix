'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import type { Content } from '@/types/content';

interface ContentCardProps {
  content: Content;
  showType?: boolean;
  onPlay?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  inWatchlist?: boolean;
  className?: string;
  variant?: 'poster' | 'backdrop';
}

export function ContentCard({
  content,
  showType = false,
  onPlay,
  onFavorite,
  isFavorite = false,
  inWatchlist = false,
  className,
  variant = 'poster',
}: ContentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const title = content.title || content.name || 'Sem título';
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  const imageUrl = variant === 'backdrop'
    ? (content.backdrop_path
        ? tmdb.getImageUrl(content.backdrop_path, 'w780')
        : content.poster_path
          ? tmdb.getImageUrl(content.poster_path, 'w500')
          : null)
    : (content.poster_path
        ? tmdb.getImageUrl(content.poster_path, 'w342')
        : null);

  const href = `/watch/${mediaType}/${content.id}`;

  return (
    <Link
      href={href}
      className={cn('block group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'poster-card',
          variant === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
        )}
      >
        {/* Image */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 skeleton" />
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && 'scale-105'
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        )}

        {/* Fallback for missing image */}
        {(!imageUrl || imageError) && imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] flex items-center justify-center">
            <span className="text-4xl text-[var(--text-tertiary)]">
              {title[0]}
            </span>
          </div>
        )}

        {/* Hover Overlay - Apple TV style: minimal, just play icon */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/40 transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-full bg-white/90 flex items-center justify-center',
              'transform transition-all duration-300',
              isHovered ? 'scale-100' : 'scale-75'
            )}
          >
            <Play size={24} fill="#000" className="text-black ml-1" />
          </div>
        </div>

        {/* Title overlay on hover */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-4',
            'bg-gradient-to-t from-black/80 to-transparent',
            'transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <h3 className="text-sm font-medium text-white line-clamp-2">
            {title}
          </h3>
          {year && (
            <p className="text-xs text-white/60 mt-1">{year}</p>
          )}
        </div>
      </div>

      {/* Title below card (mobile only) */}
      <div className="mt-2 md:hidden">
        <h3 className="text-sm text-[var(--text-primary)] line-clamp-1">
          {title}
        </h3>
        {year && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{year}</p>
        )}
      </div>
    </Link>
  );
}

// Compact card variant for grids
export function ContentCardCompact({
  content,
  className,
}: {
  content: Content;
  className?: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const title = content.title || content.name || 'Sem título';
  const posterUrl = content.poster_path
    ? tmdb.getImageUrl(content.poster_path, 'w342')
    : null;

  const href = `/watch/${mediaType}/${content.id}`;

  return (
    <Link href={href} className={cn('block group', className)}>
      <div className="poster-card aspect-[2/3]">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        {posterUrl && (
          <img
            src={posterUrl}
            alt={title}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-105'
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
    </Link>
  );
}
