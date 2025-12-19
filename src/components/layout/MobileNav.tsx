'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Film, Tv, Radio, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  const navItems = [
    {
      href: '/',
      label: 'Início',
      active: pathname === '/' && !category,
      icon: Home,
    },
    {
      href: '/?category=movie',
      label: 'Filmes',
      active: category === 'movie',
      icon: Film,
    },
    {
      href: '/?category=serie',
      label: 'Séries',
      active: category === 'serie',
      icon: Tv,
    },
    {
      href: '/tv',
      label: 'TV',
      active: pathname === '/tv',
      icon: Radio,
    },
    {
      href: '/profile',
      label: 'Perfil',
      active: pathname === '/profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur background */}
      <div className="absolute inset-0 glass" />

      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 px-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all',
                'min-w-[60px]',
                item.active
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)]'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center',
                  'transition-transform duration-300',
                  item.active && 'scale-110'
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={item.active ? 2 : 1.5}
                  className="transition-all"
                />
                {/* Active indicator dot */}
                {item.active && (
                  <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-[var(--text-primary)]" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-opacity',
                  item.active ? 'opacity-100' : 'opacity-60'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
