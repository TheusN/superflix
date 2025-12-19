'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ContentCard } from './ContentCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Content } from '@/types/content';

interface CategoryRowProps {
  title: string;
  items: Content[];
  isLoading?: boolean;
  showType?: boolean;
  href?: string;
  onFavorite?: (content: Content) => void;
  favorites?: number[];
}

export function CategoryRow({
  title,
  items,
  isLoading = false,
  showType = false,
  href,
  onFavorite,
  favorites = [],
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        {href ? (
          <Link
            href={href}
            className="text-lg md:text-xl font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2"
          >
            {title}
            <ChevronRight size={20} className="opacity-0 group-hover:opacity-100" />
          </Link>
        ) : (
          <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
        )}
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center',
            'bg-gradient-to-r from-[var(--bg-primary)] to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:from-[var(--bg-primary)]/90',
            !showLeftArrow && 'hidden'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>

        {/* Items Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]">
                  <SkeletonCard />
                </div>
              ))
            : items.map((item) => (
                <div
                  key={`${item.media_type || 'content'}-${item.id}`}
                  className="flex-shrink-0 w-[140px] md:w-[180px]"
                >
                  <ContentCard
                    content={item}
                    showType={showType}
                    onFavorite={onFavorite ? () => onFavorite(item) : undefined}
                    isFavorite={favorites.includes(item.id)}
                  />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center',
            'bg-gradient-to-l from-[var(--bg-primary)] to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:from-[var(--bg-primary)]/90',
            !showRightArrow && 'hidden'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      </div>
    </section>
  );
}
