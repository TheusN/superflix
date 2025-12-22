'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Maximize, Minimize } from 'lucide-react';
import { getEmbedPlayerUrl } from '@/services/embedtv';

interface TVEmbedPlayerProps {
  channelId: string;
  channelName?: string;
  channelLogo?: string;
  className?: string;
}

export function TVEmbedPlayer({
  channelId,
  channelName,
  channelLogo,
  className,
}: TVEmbedPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const embedUrl = getEmbedPlayerUrl(channelId);

  const toggleFullscreen = () => {
    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    try {
      if (!document.fullscreenElement) {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  return (
    <div
      className={cn(
        'relative bg-black aspect-video w-full group',
        className
      )}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin mx-auto mb-4" />
            <p className="text-white">Conectando ao canal...</p>
          </div>
        </div>
      )}

      {/* Embed iframe */}
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        onLoad={() => setIsLoading(false)}
      />

      {/* Controls Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {/* Top Bar - Channel Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-3">
            {channelLogo && (
              <img
                src={channelLogo}
                alt={channelName}
                className="w-10 h-10 rounded object-contain bg-white/10"
              />
            )}
            {channelName && (
              <h2 className="text-white font-semibold">{channelName}</h2>
            )}
          </div>
        </div>

        {/* Bottom Bar - Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-end gap-2 pointer-events-auto">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
              aria-label={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      {!isLoading && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 rounded text-white text-xs font-medium flex items-center gap-1 pointer-events-none">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AO VIVO
        </div>
      )}
    </div>
  );
}
