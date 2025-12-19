'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';

interface TVPlayerProps {
  streamUrl: string;
  channelName?: string;
  channelLogo?: string;
  onError?: () => void;
  className?: string;
}

export function TVPlayer({
  streamUrl,
  channelName,
  channelLogo,
  onError,
  className,
}: TVPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if URL is HLS stream
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('.m3u');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Error:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Erro de conexão. Verifique sua internet.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Erro de mídia. Tentando recuperar...');
              hls.recoverMediaError();
              break;
            default:
              setError('Canal indisponível no momento.');
              onError?.();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });
    } else {
      // Try direct video playback
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });
      video.addEventListener('error', () => {
        setError('Formato de stream não suportado.');
        onError?.();
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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
        'relative bg-black aspect-video w-full group',
        isFullscreen && 'fixed inset-0 z-50',
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

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        autoPlay
        playsInline
        muted={isMuted}
      />

      {/* Controls Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={toggleMute}
              className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
              aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
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
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 rounded text-white text-xs font-medium flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AO VIVO
        </div>
      )}
    </div>
  );
}
