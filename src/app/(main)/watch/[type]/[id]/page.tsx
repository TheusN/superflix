'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { tmdb, superflixApi } from '@/services/tmdb';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { CategoryRow } from '@/components/content/CategoryRow';
import { SkeletonPlayer } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { saveProgressLocal, markAsCompleted, initWatchProgress, syncToServer } from '@/services/watchProgress';
import {
  Play,
  Star,
  Clock,
  Calendar,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

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

      // Salvar novo episodio no historico quando mudar
      if (content) {
        saveToHistory(content, 0.1);
      }
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

      // Buscar trailer (já vem no append_to_response do getDetails)
      if (details.videos?.results) {
        const trailer = details.videos.results.find(
          (v: { type: string; site: string; key: string }) =>
            v.type === 'Trailer' && v.site === 'YouTube'
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      }

      // Get IMDB ID for movies (already included in getDetails via append_to_response)
      if (type === 'movie' && details.external_ids?.imdb_id) {
        setImdbId(details.external_ids.imdb_id);
      }

      // Set initial season
      if (type === 'tv' && details.seasons) {
        const firstSeason = details.seasons.find((s: Season) => s.season_number > 0);
        if (firstSeason) {
          setSelectedSeason(season || firstSeason.season_number);
        }
      }

      // Salvar no historico (localStorage + servidor se logado)
      saveToHistory(details, 0.1);
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

  // Inicializar servico de progresso
  useEffect(() => {
    initWatchProgress();

    // Sincronizar ao sair da pagina
    return () => {
      syncToServer(true);
    };
  }, []);

  const saveToHistory = (contentData: ContentDetails, progress: number = 0.1) => {
    // Salvar localmente (rapido) - sincroniza com servidor automaticamente
    saveProgressLocal({
      tmdb_id: contentData.id,
      title: contentData.title || contentData.name || 'Sem titulo',
      poster_path: contentData.poster_path,
      media_type: type,
      season: type === 'tv' ? selectedSeason : null,
      episode: type === 'tv' ? selectedEpisode : null,
      progress,
    });
  };

  // Marcar episodio atual como concluido ao mudar
  const markAsWatchedLocal = () => {
    if (content) {
      markAsCompleted({
        tmdb_id: content.id,
        title: content.title || content.name || 'Sem titulo',
        poster_path: content.poster_path,
        media_type: type,
        season: type === 'tv' ? selectedSeason : null,
        episode: type === 'tv' ? selectedEpisode : null,
      });
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
      // Marcar episodio atual como assistido antes de ir para o proximo
      markAsWatchedLocal();
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

  // Se estiver reproduzindo, mostrar o player em tela cheia
  if (isPlaying) {
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

          {/* Botao voltar */}
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

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
      </div>
    );
  }

  // Tela de apresentação
  return (
    <div className="min-h-screen bg-black">
      {/* Hero com Backdrop */}
      <div className="relative min-h-[100svh] md:min-h-[85vh]">
        {/* Backdrop Image */}
        {backdropUrl && (
          <div className="absolute inset-0">
            <Image
              src={backdropUrl}
              alt={title}
              fill
              className="object-cover object-top"
              priority
            />
            {/* Gradientes - mais forte no mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 md:via-black/50 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent md:from-black/80" />
          </div>
        )}

        {/* Botao Voltar */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex items-center gap-2 p-3 md:px-4 md:py-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Voltar</span>
        </button>

        {/* Conteudo do Hero */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-6 md:container md:mx-auto md:px-6 md:pb-16">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
              {/* Poster - Visivel em todas as telas */}
              {posterUrl && (
                <div className="w-32 md:w-56 lg:w-64 flex-shrink-0 md:-mb-24 relative z-10">
                  <Image
                    src={posterUrl}
                    alt={title}
                    width={256}
                    height={384}
                    className="w-full rounded-xl shadow-2xl"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-white text-center md:text-left w-full">
                {/* Tipo e Rating */}
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-3">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide',
                    type === 'movie' ? 'bg-blue-600' : 'bg-purple-600'
                  )}>
                    {type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                  {rating && Number(rating) > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star size={14} fill="currentColor" />
                      <span className="font-semibold">{rating}</span>
                    </span>
                  )}
                </div>

                {/* Titulo */}
                <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 leading-tight">
                  {title}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm text-gray-300">
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
                  {type === 'tv' && content.number_of_seasons && (
                    <span>{content.number_of_seasons} Temporada{content.number_of_seasons > 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Genres - Scroll horizontal no mobile */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2 mb-4 md:mb-6">
                    {genres.slice(0, 4).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2.5 py-1 bg-white/10 rounded-full text-xs md:text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sinopse (resumida) - Esconder no mobile pequeno */}
                {content.overview && (
                  <p className="hidden sm:block text-gray-300 text-sm md:text-base leading-relaxed mb-4 md:mb-6 max-w-2xl line-clamp-2 md:line-clamp-3">
                    {content.overview}
                  </p>
                )}

                {/* Botoes de Acao - Layout responsivo */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                  {/* Botao PLAY Principal */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-white text-black font-bold text-base md:text-lg rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Play size={22} fill="currentColor" />
                    Assistir {type === 'movie' ? 'Filme' : 'Agora'}
                  </button>

                  {/* Botoes secundarios em linha */}
                  <div className="flex items-center justify-center gap-3">
                    {/* Botao Trailer */}
                    {trailerKey && (
                      <button
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center gap-2 px-4 md:px-6 py-3.5 md:py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm text-sm md:text-base"
                      >
                        <Play size={18} />
                        <span className="hidden xs:inline">Trailer</span>
                      </button>
                    )}

                    {/* Favoritar */}
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={cn(
                        'flex items-center justify-center p-3.5 md:p-4 rounded-xl transition-all',
                        isFavorite
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* Compartilhar */}
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: title,
                            url: window.location.href,
                          });
                        }
                      }}
                      className="flex items-center justify-center p-3.5 md:p-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal do Trailer - Otimizado para mobile */}
      {showTrailer && trailerKey && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowTrailer(false)}
        >
          {/* Botao fechar - Posicionado dentro da tela */}
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="relative w-full h-full md:h-auto md:max-w-5xl md:aspect-video md:mx-4" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&playsinline=1`}
              className="w-full h-full md:rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content Info Abaixo */}
      <div className="bg-[var(--bg-primary)]">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 md:pt-32">
          {/* Sinopse completa */}
          {content.overview && (
            <div className="mb-8 md:mb-12 max-w-3xl">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-3 md:mb-4">
                Sinopse
              </h2>
              <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
                {content.overview}
              </p>
            </div>
          )}

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
