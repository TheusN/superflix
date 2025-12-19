'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentCard } from './ContentCard';
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
  variant?: 'poster' | 'backdrop';
}

export function CategoryRow({
  title,
  items,
  isLoading = false,
  showType = false,
  href,
  onFavorite,
  favorites = [],
  variant = 'poster',
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 20
    );
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      handleScroll();
    }
  }, [items]);

  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  const cardWidth = variant === 'backdrop' ? 'w-[260px] md:w-[320px] lg:w-[380px]' : 'w-[140px] md:w-[160px] lg:w-[180px]';

  return (
    <section
      className="py-6 md:py-8"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-8 md:px-16 lg:px-20">
        {href ? (
          <Link
            href={href}
            className="group flex items-center gap-2"
          >
            <h2 className="text-title text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors">
              {title}
            </h2>
            <ChevronRight
              size={18}
              strokeWidth={1.5}
              className="text-[var(--text-tertiary)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </Link>
        ) : (
          <h2 className="text-title text-[var(--text-primary)]">
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
            'absolute left-0 top-0 bottom-0 z-20 w-16 md:w-20',
            'flex items-center justify-start pl-2',
            'bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent',
            'transition-all duration-300',
            showLeftArrow && isHovering
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
          aria-label="Rolar para esquerda"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} strokeWidth={1.5} className="text-white" />
          </div>
        </button>

        {/* Items Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            'flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide',
            'px-8 md:px-16 lg:px-20 pb-4',
            'scroll-smooth'
          )}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-shrink-0',
                    cardWidth
                  )}
                >
                  <SkeletonCard variant={variant} />
                </div>
              ))
            : items.map((item, index) => (
                <div
                  key={`${item.media_type || 'content'}-${item.id}`}
                  className={cn(
                    'flex-shrink-0',
                    cardWidth
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <ContentCard
                    content={item}
                    showType={showType}
                    onFavorite={onFavorite ? () => onFavorite(item) : undefined}
                    isFavorite={favorites.includes(item.id)}
                    variant={variant}
                  />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-0 bottom-0 z-20 w-16 md:w-20',
            'flex items-center justify-end pr-2',
            'bg-gradient-to-l from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent',
            'transition-all duration-300',
            showRightArrow && isHovering
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
          aria-label="Rolar para direita"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight size={24} strokeWidth={1.5} className="text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}

// Skeleton card
function SkeletonCard({ variant = 'poster' }: { variant?: 'poster' | 'backdrop' }) {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden skeleton',
        variant === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
      )}
    />
  );
}

// Skeleton row for loading state
export function SkeletonRow({ variant = 'poster' }: { variant?: 'poster' | 'backdrop' }) {
  const cardWidth = variant === 'backdrop' ? 'w-[260px] md:w-[320px] lg:w-[380px]' : 'w-[140px] md:w-[160px] lg:w-[180px]';

  return (
    <section className="py-6 md:py-8">
      <div className="px-8 md:px-16 lg:px-20 mb-4">
        <div className="h-6 w-40 rounded bg-[var(--bg-tertiary)]" />
      </div>
      <div className="flex gap-3 md:gap-4 px-8 md:px-16 lg:px-20 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn('flex-shrink-0', cardWidth)}>
            <SkeletonCard variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}
