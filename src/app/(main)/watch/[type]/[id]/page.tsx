'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tmdb, superflixApi } from '@/services/tmdb';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { CategoryRow } from '@/components/content/CategoryRow';
import { SkeletonPlayer } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Play,
  Star,
  Clock,
  Calendar,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ContentDetails, Season, Episode, Content } from '@/types/content';

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const type = params.type as 'movie' | 'tv';
  const id = Number(params.id);
  const season = Number(searchParams.get('s')) || 1;
  const episode = Number(searchParams.get('e')) || 1;

  const [content, setContent] = useState<ContentDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(season);
  const [selectedEpisode, setSelectedEpisode] = useState(episode);
  const [similar, setSimilar] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadContent();
  }, [id, type]);

  useEffect(() => {
    if (content && type === 'tv') {
      loadEpisodes(selectedSeason);
    }
  }, [selectedSeason, content]);

  useEffect(() => {
    // Update URL when season/episode changes for TV
    if (type === 'tv') {
      const newUrl = `/watch/tv/${id}?s=${selectedSeason}&e=${selectedEpisode}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [selectedSeason, selectedEpisode]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [details, similarRes] = await Promise.all([
        tmdb.getDetails(type, id),
        tmdb.getSimilar(type, id),
      ]);

      setContent(details);
      setSimilar(similarRes.results || []);

      // Get IMDB ID for movies
      if (type === 'movie') {
        const externalIds = await tmdb.getExternalIds('movie', id);
        setImdbId(externalIds.imdb_id || null);
      }

      // Set initial season
      if (type === 'tv' && details.seasons) {
        const firstSeason = details.seasons.find((s: Season) => s.season_number > 0);
        if (firstSeason) {
          setSelectedSeason(season || firstSeason.season_number);
        }
      }

      // Save to history
      if (user) {
        saveToHistory(details);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpisodes = async (seasonNum: number) => {
    try {
      const data = await tmdb.getSeasonDetails(id, seasonNum);
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const saveToHistory = async (contentData: ContentDetails) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: contentData.id,
          title: contentData.title || contentData.name,
          poster_path: contentData.poster_path,
          media_type: type,
          season: type === 'tv' ? selectedSeason : null,
          episode: type === 'tv' ? selectedEpisode : null,
        }),
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleEpisodeSelect = (ep: Episode) => {
    setSelectedEpisode(ep.episode_number);
  };

  const goToNextEpisode = () => {
    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === selectedEpisode
    );
    if (currentIndex < episodes.length - 1) {
      setSelectedEpisode(episodes[currentIndex + 1].episode_number);
    }
  };

  const goToPreviousEpisode = () => {
    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === selectedEpisode
    );
    if (currentIndex > 0) {
      setSelectedEpisode(episodes[currentIndex - 1].episode_number);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <SkeletonPlayer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Conteúdo não encontrado
          </h1>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = content.title || content.name || 'Sem título';
  const backdropUrl = content.backdrop_path
    ? tmdb.getImageUrl(content.backdrop_path, 'original')
    : null;
  const posterUrl = content.poster_path
    ? tmdb.getImageUrl(content.poster_path, 'w342')
    : null;
  const rating = content.vote_average?.toFixed(1);
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const runtime = content.runtime;
  const genres = content.genres || [];

  const seasonOptions =
    content.seasons
      ?.filter((s: Season) => s.season_number > 0)
      .map((s: Season) => ({
        value: String(s.season_number),
        label: `Temporada ${s.season_number}`,
      })) || [];

  const currentEpisode = episodes.find((ep) => ep.episode_number === selectedEpisode);
  const hasNextEpisode =
    episodes.findIndex((ep) => ep.episode_number === selectedEpisode) <
    episodes.length - 1;
  const hasPrevEpisode =
    episodes.findIndex((ep) => ep.episode_number === selectedEpisode) > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Player */}
      <div className="relative">
        <VideoPlayer
          mediaType={type}
          tmdbId={id}
          imdbId={imdbId}
          season={type === 'tv' ? selectedSeason : undefined}
          episode={type === 'tv' ? selectedEpisode : undefined}
          title={title}
        />

        {/* Episode Navigation (TV only) */}
        {type === 'tv' && episodes.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToPreviousEpisode}
              disabled={!hasPrevEpisode}
              className="opacity-70 hover:opacity-100"
            >
              <ChevronLeft size={20} />
              Anterior
            </Button>
            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">
              S{selectedSeason}:E{selectedEpisode}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextEpisode}
              disabled={!hasNextEpisode}
              className="opacity-70 hover:opacity-100"
            >
              Próximo
              <ChevronRight size={20} />
            </Button>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="bg-[var(--bg-primary)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            {posterUrl && (
              <div className="hidden md:block w-48 flex-shrink-0">
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full rounded-lg shadow-xl"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                {title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-[var(--text-secondary)]">
                {rating && (
                  <span className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" fill="currentColor" />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {rating}
                    </span>
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {Math.floor(runtime / 60)}h {runtime % 60}min
                  </span>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map((genre) => (
                    <Badge key={genre.id}>{genre.name}</Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  variant={isFavorite ? 'danger' : 'secondary'}
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="gap-2"
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  {isFavorite ? 'Remover' : 'Favoritar'}
                </Button>
                <Button variant="secondary" className="gap-2">
                  <Share2 size={18} />
                  Compartilhar
                </Button>
              </div>

              {/* Overview */}
              {content.overview && (
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Sinopse
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {content.overview}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Episodes (TV only) */}
          {type === 'tv' && seasonOptions.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Episódios
                </h2>
                <Select
                  options={seasonOptions}
                  value={String(selectedSeason)}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisode(1);
                  }}
                  className="w-48"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => handleEpisodeSelect(ep)}
                    className={cn(
                      'flex gap-4 p-4 rounded-lg text-left transition-colors',
                      'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]',
                      ep.episode_number === selectedEpisode &&
                        'ring-2 ring-[var(--accent-primary)]'
                    )}
                  >
                    <div className="relative w-32 flex-shrink-0 rounded overflow-hidden">
                      <img
                        src={
                          ep.still_path
                            ? tmdb.getImageUrl(ep.still_path, 'w300')
                            : posterUrl || '/placeholder-episode.jpg'
                        }
                        alt={ep.name}
                        className="w-full aspect-video object-cover"
                      />
                      {ep.episode_number === selectedEpisode && (
                        <div className="absolute inset-0 bg-[var(--accent-primary)]/30 flex items-center justify-center">
                          <Play size={24} className="text-white" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] line-clamp-1">
                        {ep.episode_number}. {ep.name}
                      </h3>
                      {ep.overview && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1">
                          {ep.overview}
                        </p>
                      )}
                      {ep.runtime && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          {ep.runtime} min
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Similar Content */}
          {similar.length > 0 && (
            <div className="mt-12">
              <CategoryRow
                title="Títulos Semelhantes"
                items={similar.map((item) => ({ ...item, media_type: type }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
