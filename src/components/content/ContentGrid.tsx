'use client';

import { ContentCard } from './ContentCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Content } from '@/types/content';

interface ContentGridProps {
  items: Content[];
  isLoading?: boolean;
  showType?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  emptyMessage?: string;
  onFavorite?: (content: Content) => void;
  favorites?: number[];
}

export function ContentGrid({
  items,
  isLoading = false,
  showType = false,
  columns = 6,
  className,
  emptyMessage = 'Nenhum conteúdo encontrado',
  onFavorite,
  favorites = [],
}: ContentGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[var(--text-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {items.map((item) => (
        <ContentCard
          key={`${item.media_type || 'content'}-${item.id}`}
          content={item}
          showType={showType}
          onFavorite={onFavorite ? () => onFavorite(item) : undefined}
          isFavorite={favorites.includes(item.id)}
        />
      ))}
    </div>
  );
}
