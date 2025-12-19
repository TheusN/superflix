'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton rounded',
        className
      )}
    />
  );
}

export function SkeletonCard({ variant = 'poster' }: { variant?: 'poster' | 'backdrop' }) {
  return (
    <div
      className={cn(
        'skeleton rounded-lg',
        variant === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
      )}
    />
  );
}

export function SkeletonRow({ variant = 'poster' }: { variant?: 'poster' | 'backdrop' }) {
  const cardWidth = variant === 'backdrop' ? 'w-[280px] md:w-[340px]' : 'w-[150px] md:w-[180px]';

  return (
    <section className="py-6 md:py-8">
      <div className="px-6 md:px-12 mb-4">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex gap-3 md:gap-4 px-6 md:px-12 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn('flex-shrink-0', cardWidth)}>
            <SkeletonCard variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[85vh] min-h-[600px] bg-[var(--bg-secondary)]">
      <div className="absolute inset-0 skeleton" />
      <div className="hero-gradient-bottom absolute inset-0" />
      <div className="absolute bottom-24 left-6 md:left-12 space-y-4 max-w-2xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-80" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPlayer() {
  return (
    <div className="relative aspect-video w-full bg-black">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full skeleton" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pt-24">
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[150px]">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
