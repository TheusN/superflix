'use client';

import { useState, useEffect } from 'react';
import { ContentGrid } from './ContentGrid';
import { tmdb } from '@/services/tmdb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { Content } from '@/types/content';

interface SearchResultsProps {
  query: string;
  onFavorite?: (content: Content) => void;
  favorites?: number[];
}

export function SearchResults({ query, onFavorite, favorites = [] }: SearchResultsProps) {
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (query && query.trim().length > 0) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const data = await tmdb.search(query);
      // Filter to only movies and TV shows (exclude persons)
      const filtered = data.results
        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item) => ({
          ...item,
          media_type: item.media_type as 'movie' | 'tv',
        })) as Content[];
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults =
    filter === 'all'
      ? results
      : results.filter((item) => item.media_type === filter);

  const movieCount = results.filter((r) => r.media_type === 'movie').length;
  const tvCount = results.filter((r) => r.media_type === 'tv').length;

  if (!query || query.trim().length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Resultados para &ldquo;{query}&rdquo;
        </h1>

        <Tabs defaultValue="all" onChange={(value) => setFilter(value as 'all' | 'movie' | 'tv')}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              Todos ({results.length})
            </TabsTrigger>
            <TabsTrigger value="movie">
              Filmes ({movieCount})
            </TabsTrigger>
            <TabsTrigger value="tv">
              Séries ({tvCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ContentGrid
              items={filteredResults}
              isLoading={isLoading}
              showType={true}
              columns={6}
              onFavorite={onFavorite}
              favorites={favorites}
              emptyMessage="Nenhum resultado encontrado"
            />
          </TabsContent>

          <TabsContent value="movie">
            <ContentGrid
              items={filteredResults}
              isLoading={isLoading}
              columns={6}
              onFavorite={onFavorite}
              favorites={favorites}
              emptyMessage="Nenhum filme encontrado"
            />
          </TabsContent>

          <TabsContent value="tv">
            <ContentGrid
              items={filteredResults}
              isLoading={isLoading}
              columns={6}
              onFavorite={onFavorite}
              favorites={favorites}
              emptyMessage="Nenhuma série encontrada"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
