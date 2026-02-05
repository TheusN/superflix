'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Search, User, LogOut, Settings, ChevronDown, Film, Tv, Loader2 } from 'lucide-react';
import { ClearCacheButton } from '@/components/ui/ClearCacheButton';
import { tmdb } from '@/services/tmdb';

interface SearchSuggestion {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const navLinks = [
    { href: '/', label: 'Início', active: pathname === '/' },
    { href: '/movies', label: 'Filmes', active: pathname === '/movies' || pathname.startsWith('/movies/') },
    { href: '/series', label: 'Séries', active: pathname === '/series' || pathname.startsWith('/series/') },
    { href: '/anime', label: 'Animes', active: pathname === '/anime' || pathname.startsWith('/anime/') },
    { href: '/tv', label: 'TV ao Vivo', active: pathname === '/tv' },
    { href: '/calendario', label: 'Calendário', active: pathname === '/calendario' },
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
        setSuggestions([]);
      }
    };
    if (searchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [searchOpen]);

  // Buscar sugestoes com debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const data = await tmdb.search(query);
      const filtered = data.results
        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          title: item.title || item.name || '',
          media_type: item.media_type as 'movie' | 'tv',
          poster_path: item.poster_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          vote_average: item.vote_average,
        }));
      setSuggestions(filtered);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erro ao buscar sugestoes:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, fetchSuggestions]);

  // Navegacao por teclado nas sugestoes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      goToContent(suggestions[selectedIndex]);
    }
  };

  // Ir para pagina do conteudo
  const goToContent = (item: SearchSuggestion) => {
    router.push(`/watch/${item.media_type}/${item.id}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  // Formatar ano
  const getYear = (item: SearchSuggestion) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
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
          onClick={() => {
            setSearchOpen(false);
            setSuggestions([]);
          }}
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
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full pl-16 pr-12 py-5 text-lg',
                  'bg-[var(--bg-elevated)]',
                  suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl',
                  'text-white placeholder-[var(--text-tertiary)]',
                  'border border-[var(--border-color)]',
                  suggestions.length > 0 && 'border-b-0',
                  'focus:outline-none focus:border-white/30',
                  'transition-colors'
                )}
              />
              {isLoadingSuggestions && (
                <Loader2
                  size={20}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] animate-spin"
                />
              )}
            </form>

            {/* Sugestoes */}
            {suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] border-t-0 rounded-b-2xl overflow-hidden"
              >
                {suggestions.map((item, index) => (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => goToContent(item)}
                    className={cn(
                      'w-full flex items-center gap-4 px-4 py-3 text-left transition-colors',
                      'hover:bg-white/10',
                      selectedIndex === index && 'bg-white/10'
                    )}
                  >
                    {/* Poster */}
                    <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                      {item.poster_path ? (
                        <Image
                          src={tmdb.getImageUrl(item.poster_path, 'w92')}
                          alt={item.title}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === 'movie' ? (
                            <Film size={20} className="text-[var(--text-tertiary)]" />
                          ) : (
                            <Tv size={20} className="text-[var(--text-tertiary)]" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          item.media_type === 'movie' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        )}>
                          {item.media_type === 'movie' ? 'Filme' : 'Série'}
                        </span>
                        {getYear(item) && <span>{getYear(item)}</span>}
                        {item.vote_average && item.vote_average > 0 && (
                          <span className="text-yellow-500">★ {item.vote_average.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Ver todos os resultados */}
                <button
                  onClick={handleSearch}
                  className="w-full py-3 text-center text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors border-t border-[var(--border-color)]"
                >
                  Ver todos os resultados para "{searchQuery}"
                </button>
              </div>
            )}

            <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
              {searchQuery.length < 3 ? (
                <>Digite pelo menos <strong>3 caracteres</strong> para buscar</>
              ) : (
                <>Pressione <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg text-xs font-medium">ESC</kbd> para fechar</>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
