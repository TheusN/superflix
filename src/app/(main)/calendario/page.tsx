'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Tv,
  Play,
  Loader2
} from 'lucide-react';

interface CalendarEpisode {
  title: string;
  episode: string;
  season: number;
  number: number;
  air_date: string;
  type: number; // 2=série, 3=anime, 5=drama
  tmdb_id: string;
  imdb_id: string;
  poster: string;
  backdrop: string;
  status: 'Atualizado' | 'Futuro' | 'Hoje';
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const TYPE_LABELS: Record<number, string> = {
  2: 'Série',
  3: 'Anime',
  5: 'Drama',
};

const TYPE_COLORS: Record<number, string> = {
  2: 'bg-purple-600',
  3: 'bg-pink-600',
  5: 'bg-amber-600',
};

const STATUS_COLORS: Record<string, string> = {
  'Atualizado': 'bg-green-600',
  'Hoje': 'bg-blue-600',
  'Futuro': 'bg-gray-600',
};

export default function CalendarioPage() {
  const [episodes, setEpisodes] = useState<CalendarEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://superflixapi.cv/calendario.php');
      if (!response.ok) throw new Error('Falha ao carregar calendário');
      const data = await response.json();
      setEpisodes(data);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
      setError('Não foi possível carregar o calendário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar episódios
  const filteredEpisodes = useMemo(() => {
    let result = episodes;

    if (filterType !== null) {
      result = result.filter(ep => ep.type === filterType);
    }

    if (filterStatus !== null) {
      result = result.filter(ep => ep.status === filterStatus);
    }

    return result;
  }, [episodes, filterType, filterStatus]);

  // Agrupar por data
  const groupedByDate = useMemo(() => {
    const groups: Record<string, CalendarEpisode[]> = {};

    filteredEpisodes.forEach(ep => {
      if (!groups[ep.air_date]) {
        groups[ep.air_date] = [];
      }
      groups[ep.air_date].push(ep);
    });

    // Ordenar por data (mais recente primeiro)
    const sortedKeys = Object.keys(groups).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedKeys.map(date => ({
      date,
      episodes: groups[date],
    }));
  }, [filteredEpisodes]);

  // Estatísticas
  const stats = useMemo(() => {
    const today = episodes.filter(ep => ep.status === 'Hoje').length;
    const updated = episodes.filter(ep => ep.status === 'Atualizado').length;
    const future = episodes.filter(ep => ep.status === 'Futuro').length;
    const series = episodes.filter(ep => ep.type === 2).length;
    const animes = episodes.filter(ep => ep.type === 3).length;
    const dramas = episodes.filter(ep => ep.type === 5).length;

    return { today, updated, future, series, animes, dramas, total: episodes.length };
  }, [episodes]);

  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilterType(null);
    setFilterStatus(null);
  };

  const hasActiveFilters = filterType !== null || filterStatus !== null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-purple-900/30 to-transparent pt-20 md:pt-24 pb-8 md:pb-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="p-2.5 md:p-3 bg-purple-600 rounded-xl">
              <Calendar size={24} className="text-white md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Calendário
              </h1>
              <p className="text-gray-400 text-sm md:text-base mt-0.5 md:mt-1">
                Lançamentos de séries, animes e dramas
              </p>
            </div>
          </div>

          {/* Stats Cards - Scroll horizontal no mobile */}
          {!isLoading && (
            <div className="flex md:grid md:grid-cols-6 gap-2 md:gap-3 mt-6 md:mt-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex-shrink-0 w-24 md:w-auto bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10">
                <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Total</p>
              </div>
              <div className="flex-shrink-0 w-24 md:w-auto bg-blue-600/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-blue-500/30">
                <p className="text-xl md:text-2xl font-bold text-blue-400">{stats.today}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Hoje</p>
              </div>
              <div className="flex-shrink-0 w-24 md:w-auto bg-green-600/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-green-500/30">
                <p className="text-xl md:text-2xl font-bold text-green-400">{stats.updated}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Atualizados</p>
              </div>
              <div className="flex-shrink-0 w-24 md:w-auto bg-purple-600/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-purple-500/30">
                <p className="text-xl md:text-2xl font-bold text-purple-400">{stats.series}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Séries</p>
              </div>
              <div className="flex-shrink-0 w-24 md:w-auto bg-pink-600/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-pink-500/30">
                <p className="text-xl md:text-2xl font-bold text-pink-400">{stats.animes}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Animes</p>
              </div>
              <div className="flex-shrink-0 w-24 md:w-auto bg-amber-600/20 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-amber-500/30">
                <p className="text-xl md:text-2xl font-bold text-amber-400">{stats.dramas}</p>
                <p className="text-[10px] md:text-xs text-gray-400">Dramas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-[72px] z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          {/* Mobile: Scroll horizontal com todos os filtros */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {/* Tipo */}
              <button
                onClick={() => setFilterType(filterType === 2 ? null : 2)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterType === 2 ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Séries
              </button>
              <button
                onClick={() => setFilterType(filterType === 3 ? null : 3)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterType === 3 ? 'bg-pink-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Animes
              </button>
              <button
                onClick={() => setFilterType(filterType === 5 ? null : 5)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterType === 5 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Dramas
              </button>
              <span className="w-px h-4 bg-white/20 flex-shrink-0" />
              <button
                onClick={() => setFilterStatus(filterStatus === 'Hoje' ? null : 'Hoje')}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterStatus === 'Hoje' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Hoje
              </button>
              <button
                onClick={() => setFilterStatus(filterStatus === 'Atualizado' ? null : 'Atualizado')}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterStatus === 'Atualizado' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Atualizados
              </button>
              <button
                onClick={() => setFilterStatus(filterStatus === 'Futuro' ? null : 'Futuro')}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterStatus === 'Futuro' ? 'bg-gray-600 text-white' : 'bg-white/10 text-gray-300'
                )}
              >
                Em Breve
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-red-400"
                >
                  Limpar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{filteredEpisodes.length} episódios</p>
          </div>

          {/* Desktop: Layout original */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {/* Tipo */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Tipo:</span>
                <button
                  onClick={() => setFilterType(filterType === 2 ? null : 2)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterType === 2 ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Séries
                </button>
                <button
                  onClick={() => setFilterType(filterType === 3 ? null : 3)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterType === 3 ? 'bg-pink-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Animes
                </button>
                <button
                  onClick={() => setFilterType(filterType === 5 ? null : 5)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterType === 5 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Dramas
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                <span className="text-sm text-gray-400">Status:</span>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'Hoje' ? null : 'Hoje')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'Hoje' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'Atualizado' ? null : 'Atualizado')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'Atualizado' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Atualizados
                </button>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'Futuro' ? null : 'Futuro')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'Futuro' ? 'bg-gray-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  Em Breve
                </button>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-400">
              {filteredEpisodes.length} episódios
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
            <p className="text-gray-400">Carregando calendário...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadCalendar}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum episódio encontrado com os filtros selecionados</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedByDate.map(({ date, episodes: dayEpisodes }) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'px-3 py-1 rounded-lg text-sm font-semibold',
                    date === new Date().toISOString().split('T')[0]
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300'
                  )}>
                    <Clock size={14} className="inline mr-1.5" />
                    {formatDate(date)}
                  </div>
                  <span className="text-sm text-gray-500">{dayEpisodes.length} episódios</span>
                </div>

                {/* Episodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dayEpisodes.map((ep, idx) => (
                    <EpisodeCard key={`${ep.tmdb_id}-${ep.season}-${ep.number}-${idx}`} episode={ep} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de Card do Episódio
function EpisodeCard({ episode }: { episode: CalendarEpisode }) {
  const posterUrl = episode.poster
    ? `${TMDB_IMAGE_BASE}/w342${episode.poster}`
    : null;

  const backdropUrl = episode.backdrop
    ? `${TMDB_IMAGE_BASE}/w780${episode.backdrop}`
    : null;

  return (
    <Link
      href={`/watch/tv/${episode.tmdb_id}?s=${episode.season}&e=${episode.number}`}
      className="group bg-[var(--bg-secondary)] rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500/50 transition-all"
    >
      {/* Backdrop/Poster */}
      <div className="relative aspect-video bg-[var(--bg-tertiary)]">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={episode.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : posterUrl ? (
          <Image
            src={posterUrl}
            alt={episode.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Tv size={32} className="text-gray-600" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold text-white',
            TYPE_COLORS[episode.type] || 'bg-gray-600'
          )}>
            {TYPE_LABELS[episode.type] || 'Outro'}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold text-white',
            STATUS_COLORS[episode.status] || 'bg-gray-600'
          )}>
            {episode.status}
          </span>
        </div>

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Episode Info */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded inline-block">
            T{episode.season} · {episode.episode}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-purple-400 transition-colors">
          {episode.title}
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          {new Date(episode.air_date + 'T00:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>
    </Link>
  );
}
