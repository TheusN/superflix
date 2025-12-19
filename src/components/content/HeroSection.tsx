'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, Plus, Volume2, VolumeX } from 'lucide-react';
import type { Content, ContentDetails, Genre } from '@/types/content';

interface HeroSectionProps {
  content?: Content | ContentDetails | null;
  items?: Content[];
  isLoading?: boolean;
  autoRotate?: boolean;
  rotateInterval?: number;
}

export function HeroSection({
  content,
  items,
  isLoading = false,
  autoRotate = true,
  rotateInterval = 8000,
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // Use items array or single content
  const heroItems = items?.slice(0, 5) || (content ? [content] : []);
  const currentContent = heroItems[currentIndex];

  // Auto-rotate hero items
  useEffect(() => {
    if (!autoRotate || heroItems.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroItems.length);
        setIsTransitioning(false);
      }, 500);
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [autoRotate, heroItems.length, rotateInterval]);

  // Reset video state on content change
  useEffect(() => {
    setShowVideo(false);
    setTrailerKey(null);
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 500);
  }, [currentIndex]);

  if (isLoading || !currentContent) {
    return (
      <div className="relative h-[85vh] min-h-[600px] bg-[var(--bg-secondary)]">
        <div className="absolute inset-0 skeleton" />
        <div className="hero-gradient-bottom absolute inset-0" />
      </div>
    );
  }

  const title = currentContent.title || currentContent.name || 'Sem título';
  const mediaType = currentContent.media_type || (currentContent.first_air_date ? 'tv' : 'movie');
  const backdropUrl = currentContent.backdrop_path
    ? tmdb.getImageUrl(currentContent.backdrop_path, 'original')
    : null;
  const releaseDate = currentContent.release_date || currentContent.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const overview = currentContent.overview || '';
  const genres: Genre[] = 'genres' in currentContent && Array.isArray(currentContent.genres)
    ? currentContent.genres
    : [];
  const rating = currentContent.vote_average ? currentContent.vote_average.toFixed(1) : null;

  const href = `/watch/${mediaType}/${currentContent.id}`;

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-700',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
      >
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top animate-hero-reveal"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]" />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 hero-gradient-bottom" />
      <div className="absolute inset-0 hero-gradient-left opacity-80" />
      <div className="absolute inset-0 hero-vignette" />

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="w-full max-w-[1800px] mx-auto px-8 md:px-16 lg:px-20 pb-28 md:pb-36">
          <div
            className={cn(
              'max-w-2xl transition-all duration-700 stagger-children',
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}
          >
            {/* Category Tag */}
            <div className="mb-4">
              <span className="text-overline">
                {mediaType === 'movie' ? 'Filme' : mediaType === 'tv' ? 'Série' : 'Anime'}
                {year && ` • ${year}`}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-display text-white mb-4 drop-shadow-2xl">
              {title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              {rating && (
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{rating}</span>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Avaliação
                  </span>
                </div>
              )}
              {genres && genres.length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  {genres.slice(0, 3).map((g, i) => (
                    <span
                      key={g.id}
                      className="text-sm text-[var(--text-secondary)]"
                    >
                      {g.name}
                      {i < Math.min(genres.length, 3) - 1 && (
                        <span className="ml-2 text-[var(--text-tertiary)]">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            <p className="text-body text-[var(--text-secondary)] line-clamp-3 mb-8 max-w-xl">
              {overview}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href={href} className="btn-primary">
                <Play size={20} fill="currentColor" />
                Assistir
              </Link>

              <button className="btn-icon" aria-label="Adicionar à lista">
                <Plus size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Slide Indicators */}
          {heroItems.length > 1 && (
            <div className="absolute bottom-8 right-8 md:right-16 lg:right-20 flex items-center gap-2">
              {heroItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    index === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-4 bg-white/30 hover:bg-white/50'
                  )}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mute button (for video) */}
      {showVideo && trailerKey && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute bottom-8 left-6 md:left-12 btn-icon"
          aria-label={muted ? 'Ativar som' : 'Desativar som'}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
    </section>
  );
}

// Skeleton loader for hero
export function SkeletonHero() {
  return (
    <div className="relative h-[85vh] min-h-[600px] bg-[var(--bg-secondary)]">
      <div className="absolute inset-0 skeleton" />
      <div className="hero-gradient-bottom absolute inset-0" />
      <div className="absolute bottom-28 left-8 md:left-16 lg:left-20 space-y-4">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-12 w-80 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/10" />
        <div className="h-4 w-96 rounded bg-white/10" />
        <div className="flex gap-3 mt-6">
          <div className="h-12 w-32 rounded-lg bg-white/10" />
          <div className="h-12 w-12 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
