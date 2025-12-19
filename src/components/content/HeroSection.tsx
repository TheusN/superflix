'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Content, ContentDetails } from '@/types/content';

interface HeroSectionProps {
  content?: Content | ContentDetails | null;
  isLoading?: boolean;
  autoPlay?: boolean;
  showTrailer?: boolean;
}

export function HeroSection({
  content,
  isLoading = false,
  autoPlay = false,
  showTrailer = false,
}: HeroSectionProps) {
  const [muted, setMuted] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    if (showTrailer && content && 'videos' in content && content.videos?.results) {
      const trailer = content.videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      if (trailer) {
        setTrailerKey(trailer.key);
      }
    }
  }, [content, showTrailer]);

  if (isLoading || !content) {
    return (
      <div className="relative h-[70vh] min-h-[500px] bg-[var(--bg-secondary)] animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      </div>
    );
  }

  const title = content.title || content.name || 'Sem título';
  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const backdropUrl = content.backdrop_path
    ? tmdb.getImageUrl(content.backdrop_path, 'original')
    : null;
  const rating = content.vote_average ? content.vote_average.toFixed(1) : null;
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const overview = content.overview || '';
  const genres = 'genres' in content ? content.genres : [];

  const href = `/watch/${mediaType}/${content.id}`;

  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {showTrailer && trailerKey && autoPlay ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full scale-150"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button
              onClick={() => setMuted(!muted)}
              className="absolute bottom-24 right-8 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        ) : backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--bg-secondary)]" />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="max-w-2xl space-y-4">
            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
              {title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-300">
              {rating && (
                <span className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="font-semibold">{rating}</span>
                </span>
              )}
              {year && <span>{year}</span>}
              {genres && genres.length > 0 && (
                <span className="hidden sm:inline">
                  {genres.slice(0, 3).map((g) => g.name).join(' • ')}
                </span>
              )}
            </div>

            {/* Overview */}
            <p className="text-sm md:text-base text-gray-300 line-clamp-3 md:line-clamp-4">
              {overview}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={href}>
                <Button size="lg" className="gap-2">
                  <Play size={20} fill="currentColor" />
                  Assistir
                </Button>
              </Link>
              <Link href={href}>
                <Button variant="secondary" size="lg" className="gap-2">
                  <Info size={20} />
                  Mais Informações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
