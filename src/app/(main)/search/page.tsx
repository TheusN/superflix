'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SearchResults } from '@/components/content/SearchResults';
import { SkeletonRow } from '@/components/ui/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          Buscar
        </h1>
        <p className="text-[var(--text-secondary)]">
          Digite algo na barra de pesquisa para encontrar filmes e séries.
        </p>
      </div>
    );
  }

  return <SearchResults query={query} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SkeletonRow />}>
      <SearchContent />
    </Suspense>
  );
}
