'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, Star, Clock, Calendar, Heart, Plus, Check, X } from 'lucide-react';
import type { ContentDetails, Season, Episode } from '@/types/content';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  mediaType: 'movie' | 'tv';
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function ContentModal({
  isOpen,
  onClose,
  contentId,
  mediaType,
  onFavorite,
  isFavorite = false,
}: ContentModalProps) {
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (isOpen && contentId) {
      loadContent();
    }
  }, [isOpen, contentId, mediaType]);

  useEffect(() => {
    if (content && mediaType === 'tv' && content.seasons) {
      loadEpisodes(selectedSeason);
    }
  }, [selectedSeason, content]);

  const loadContent = async () => {
    if (!contentId) return;

    setIsLoading(true);
    try {
      const data = await tmdb.getDetails(mediaType, contentId);
      setContent(data);

      if (mediaType === 'tv' && data.seasons && data.seasons.length > 0) {
        const firstSeason = data.seasons.find((s: Season) => s.season_number > 0);
        if (firstSeason) {
          setSelectedSeason(firstSeason.season_number);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpisodes = async (seasonNumber: number) => {
    if (!contentId) return;

    setLoadingEpisodes(true);
    try {
      const data = await tmdb.getSeasonDetails(contentId, seasonNumber);
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  if (!content && !isLoading) {
    return null;
  }

  const title = content?.title || content?.name || 'Carregando...';
  const backdropUrl = content?.backdrop_path
    ? tmdb.getImageUrl(content.backdrop_path, 'w1280')
    : null;
  const posterUrl = content?.poster_path
    ? tmdb.getImageUrl(content.poster_path, 'w342')
    : null;
  const rating = content?.vote_average?.toFixed(1);
  const releaseDate = content?.release_date || content?.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const runtime = content?.runtime;
  const genres = content?.genres || [];
  const overview = content?.overview || '';

  const trailer = content?.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  const seasonOptions =
    content?.seasons
      ?.filter((s: Season) => s.season_number > 0)
      .map((s: Season) => ({
        value: String(s.season_number),
        label: `Temporada ${s.season_number}`,
      })) || [];

  const href = `/watch/${mediaType}/${contentId}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Hero/Backdrop */}
        <div className="relative h-64 md:h-80">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[var(--bg-tertiary)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-transparent" />

          {/* Poster (mobile hidden) */}
          {posterUrl && (
            <div className="hidden md:block absolute -bottom-16 left-6 w-32 rounded-lg overflow-hidden shadow-xl">
              <img src={posterUrl} alt={title} className="w-full aspect-[2/3] object-cover" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:pl-44">
          {/* Title & Metadata */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{title}</h2>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              {rating && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                  <span className="font-medium text-[var(--text-primary)]">{rating}</span>
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {Math.floor(runtime / 60)}h {runtime % 60}min
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge key={genre.id}>{genre.name}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href={href}>
              <Button size="lg" className="gap-2">
                <Play size={18} fill="currentColor" />
                Assistir
              </Button>
            </Link>
            {onFavorite && (
              <Button
                variant={isFavorite ? 'danger' : 'secondary'}
                size="lg"
                onClick={onFavorite}
                className="gap-2"
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? 'Remover' : 'Favoritar'}
              </Button>
            )}
          </div>

          {/* Overview */}
          {overview && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sinopse</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">{overview}</p>
            </div>
          )}

          {/* Trailer */}
          {trailer && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Trailer</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Episodes (TV only) */}
          {mediaType === 'tv' && seasonOptions.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Episódios</h3>
                <Select
                  options={seasonOptions}
                  value={String(selectedSeason)}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="w-40"
                />
              </div>

              <div className="space-y-3">
                {loadingEpisodes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : episodes.length > 0 ? (
                  episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={`/watch/tv/${contentId}?s=${selectedSeason}&e=${episode.episode_number}`}
                      className="flex gap-4 p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 transition-colors group"
                    >
                      <div className="relative w-32 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={
                            episode.still_path
                              ? tmdb.getImageUrl(episode.still_path, 'w300')
                              : posterUrl || '/placeholder-episode.jpg'
                          }
                          alt={episode.name}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={24} className="text-white" fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-primary)] line-clamp-1">
                          {episode.episode_number}. {episode.name}
                        </h4>
                        {episode.overview && (
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1">
                            {episode.overview}
                          </p>
                        )}
                        {episode.runtime && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {episode.runtime} min
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center py-4 text-[var(--text-secondary)]">
                    Nenhum episódio disponível
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
