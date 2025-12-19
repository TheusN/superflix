'use client';

import { useState, useEffect } from 'react';
import { tmdb } from '@/services/tmdb';
import { ContentGrid } from '@/components/content/ContentGrid';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { Content } from '@/types/content';

export default function AnimePage() {
  const [anime, setAnime] = useState<Content[]>([]);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setAnime([]);
    loadAnime(1, true);
  }, [sortBy]);

  const loadAnime = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await tmdb.getAnime(pageNum, sortBy);
      const newAnime = (data.results || []).map((item: Content) => ({
        ...item,
        media_type: 'tv' as const,
      }));
      setAnime(reset ? newAnime : [...anime, ...newAnime]);
      setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDB limits to 500 pages
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading anime:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      loadAnime(page + 1);
    }
  };

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade' },
    { value: 'vote_average.desc', label: 'Melhor Avaliação' },
    { value: 'first_air_date.desc', label: 'Mais Recentes' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Animes
        </h1>

        <div className="flex gap-3">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Grid */}
      <ContentGrid
        items={anime}
        isLoading={isLoading}
        columns={6}
        emptyMessage="Nenhum anime encontrado"
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
