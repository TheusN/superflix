'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-secondary)] rounded-lg overflow-hidden',
        hover && 'transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'poster' | 'backdrop' | 'square';
}

export function CardImage({ src, alt, className, aspectRatio = 'poster' }: CardImageProps) {
  const aspectClasses = {
    poster: 'aspect-[2/3]',
    backdrop: 'aspect-video',
    square: 'aspect-square',
  };

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('p-3', className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('font-semibold text-[var(--text-primary)] line-clamp-1', className)}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  lines?: number;
}

export function CardDescription({ children, className, lines = 2 }: CardDescriptionProps) {
  return (
    <p
      className={cn(
        'text-sm text-[var(--text-secondary)]',
        lines === 1 && 'line-clamp-1',
        lines === 2 && 'line-clamp-2',
        lines === 3 && 'line-clamp-3',
        className
      )}
    >
      {children}
    </p>
  );
}
