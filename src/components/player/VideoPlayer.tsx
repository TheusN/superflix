'use client';

import { useState, useEffect, useRef } from 'react';
import { superflixApi } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  imdbId?: string | null;
  season?: number;
  episode?: number;
  title?: string;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  className?: string;
}

export function VideoPlayer({
  mediaType,
  tmdbId,
  imdbId,
  season,
  episode,
  title,
  onProgress,
  onEnded,
  className,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate player URL
  const playerUrl = mediaType === 'movie'
    ? superflixApi.getPlayerUrl('movie', imdbId || String(tmdbId))
    : superflixApi.getPlayerUrl('tv', String(tmdbId), season, episode);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [playerUrl]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Erro ao carregar o player. Tente novamente.');
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black aspect-video w-full',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin mx-auto mb-4" />
            <p className="text-white">Carregando player...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = playerUrl;
                }
              }}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Player iframe */}
      <iframe
        ref={iframeRef}
        src={playerUrl}
        className={cn(
          'absolute inset-0 w-full h-full',
          (isLoading || error) && 'invisible'
        )}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors z-10"
        aria-label={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {/* Title Overlay */}
      {title && !isLoading && !error && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <h2 className="text-white font-semibold">
            {title}
            {mediaType === 'tv' && season && episode && (
              <span className="text-gray-300 font-normal ml-2">
                S{season}:E{episode}
              </span>
            )}
          </h2>
        </div>
      )}
    </div>
  );
}
