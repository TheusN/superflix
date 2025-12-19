'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Search, User, LogOut, Settings, ChevronDown, Trash2 } from 'lucide-react';
import { ClearCacheButton } from '@/components/ui/ClearCacheButton';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const category = searchParams.get('category');

  const navLinks = [
    { href: '/', label: 'Início', active: pathname === '/' && !category },
    { href: '/?category=movie', label: 'Filmes', active: category === 'movie' },
    { href: '/?category=serie', label: 'Séries', active: category === 'serie' },
    { href: '/?category=anime', label: 'Animes', active: category === 'anime' },
    { href: '/tv', label: 'TV ao Vivo', active: pathname === '/tv' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    if (searchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'glass'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        )}
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center flex-shrink-0"
          >
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              superflix
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'nav-link',
                  link.active && 'active'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                'w-11 h-11 flex items-center justify-center rounded-full transition-all',
                'text-white/70 hover:text-white hover:bg-white/10'
              )}
              aria-label="Buscar"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {/* Clear Cache (for non-logged users) */}
            {!user && (
              <ClearCacheButton variant="button" className="hidden sm:flex" />
            )}

            {/* User Menu */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-3 pl-3 pr-4 py-2 rounded-full transition-all',
                    'hover:bg-white/10 text-white'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={cn(
                      'hidden md:block transition-transform duration-300',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 py-3 glass rounded-2xl shadow-2xl animate-fade-in-scale origin-top-right">
                    {/* User Info */}
                    <div className="px-5 py-3 border-b border-white/10">
                      <p className="text-base font-medium text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] truncate mt-1">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-4 px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={18} strokeWidth={1.5} />
                        Meu Perfil
                      </Link>

                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-4 px-5 py-3 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={18} strokeWidth={1.5} />
                          Administração
                        </Link>
                      )}
                    </div>

                    {/* Utilities */}
                    <div className="border-t border-white/10 pt-2 mt-1">
                      <ClearCacheButton variant="menu-item" />
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/10 pt-2 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-4 px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                      >
                        <LogOut size={18} strokeWidth={1.5} />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2.5 text-sm font-medium rounded-full bg-white text-black hover:bg-white/90 transition-all"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="max-w-2xl mx-auto pt-32 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={24}
                strokeWidth={1.5}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar filmes, séries, animes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-16 pr-6 py-5 text-lg',
                  'bg-[var(--bg-elevated)] rounded-2xl',
                  'text-white placeholder-[var(--text-tertiary)]',
                  'border border-[var(--border-color)]',
                  'focus:outline-none focus:border-white/30',
                  'transition-colors'
                )}
              />
            </form>
            <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
              Pressione <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg text-xs font-medium">ESC</kbd> para fechar
            </p>
          </div>
        </div>
      )}
    </>
  );
}
