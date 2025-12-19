'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/services/tmdb';
import { ContentGrid } from '@/components/content/ContentGrid';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { Content, Genre } from '@/types/content';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    setPage(1);
    setMovies([]);
    loadMovies(1, true);
  }, [selectedGenre, sortBy]);

  const loadGenres = async () => {
    try {
      const data = await tmdb.getGenres('movie');
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const loadMovies = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await tmdb.discover('movie', {
        page: pageNum,
        sort_by: sortBy,
        with_genres: selectedGenre || undefined,
      });

      const newMovies = data.results || [];
      setMovies(reset ? newMovies : [...movies, ...newMovies]);
      setTotalPages(data.total_pages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      loadMovies(page + 1);
    }
  };

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade' },
    { value: 'vote_average.desc', label: 'Melhor Avaliação' },
    { value: 'release_date.desc', label: 'Mais Recentes' },
    { value: 'revenue.desc', label: 'Maior Bilheteria' },
  ];

  const genreOptions = [
    { value: '', label: 'Todos os Gêneros' },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Filmes
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            options={genreOptions}
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full sm:w-48"
          />
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Grid */}
      <ContentGrid
        items={movies}
        isLoading={isLoading}
        columns={6}
        emptyMessage="Nenhum filme encontrado"
      />

      {/* Load More */}
      {!isLoading && page < totalPages && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            loading={isLoadingMore}
            variant="secondary"
            size="lg"
          >
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
}
