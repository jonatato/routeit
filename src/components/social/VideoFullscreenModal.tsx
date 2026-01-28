import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { SocialVideo } from '../../services/socialVideos';
import { MobileReactionBar } from './MobileReactionBar';
import { getVideoReactionStats } from '../../services/socialVideos';

interface VideoFullscreenModalProps {
  video: SocialVideo;
  currentUserId?: string;
  isOwner?: boolean;
  onClose: () => void;
  onDelete?: (videoId: string) => void;
  onReactionUpdate?: () => void;
  onCommentsOpen?: () => void;
  videos: SocialVideo[];
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function VideoFullscreenModal({
  video,
  currentUserId,
  isOwner,
  onClose,
  onDelete,
  onReactionUpdate,
  onCommentsOpen,
  videos,
  currentIndex,
  onNavigate,
}: VideoFullscreenModalProps) {
  const [embedError, setEmbedError] = useState(false);
  const [reactionStats, setReactionStats] = useState<Record<string, number>>({});
  const embedRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    loadReactionStats();
  }, [video.reactions]);

  // Force reload when video changes
  useEffect(() => {
    setEmbedError(false);
    if (embedRef.current) {
      embedRef.current.innerHTML = '';
    }
  }, [video.id]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && currentIndex < videos.length - 1) {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onClose, onNavigate]);

  useEffect(() => {
    if (video.embed_code && embedRef.current) {
      retryCountRef.current = 0;
      embedRef.current.innerHTML = '';
      
      try {
        embedRef.current.innerHTML = video.embed_code;
        setEmbedError(false);
        
        // Ajustar iframes para móvil
        setTimeout(() => {
          if (embedRef.current) {
            const iframes = embedRef.current.querySelectorAll('iframe');
            iframes.forEach(iframe => {
              iframe.style.width = '100%';
              iframe.style.height = '100vh';
              iframe.style.maxWidth = '100vw';
              iframe.style.maxHeight = '100vh';
              iframe.style.border = 'none';
              iframe.style.margin = '0';
              iframe.style.padding = '0';
              iframe.style.position = 'absolute';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            });
          }
        }, 100);

        // Process platform-specific embeds
        if (video.platform === 'tiktok' && video.embed_code.includes('tiktok-embed')) {
          const processTikTok = () => {
            if (retryCountRef.current >= 10) {
              setEmbedError(true);
              return;
            }
            
            const tiktokEmbed = (window as any).tiktokEmbed;
            if (tiktokEmbed && typeof tiktokEmbed.process === 'function') {
              try {
                tiktokEmbed.process();
              } catch (e) {
                console.error('Error processing TikTok embed:', e);
              }
            } else {
              retryCountRef.current++;
              setTimeout(processTikTok, 500);
            }
          };
          
          setTimeout(processTikTok, 100);
        }
        
        if (video.platform === 'instagram' && video.embed_code.includes('instagram-media')) {
          const processInstagram = () => {
            if (retryCountRef.current >= 10) return;
            
            const instagramEmbed = (window as any).instgrm;
            if (instagramEmbed && typeof instagramEmbed.Embeds?.process === 'function') {
              try {
                instagramEmbed.Embeds.process();
              } catch (e) {
                console.error('Error processing Instagram embed:', e);
              }
            } else {
              retryCountRef.current++;
              setTimeout(processInstagram, 500);
            }
          };
          
          setTimeout(processInstagram, 100);
        }
      } catch (error) {
        console.error('Error loading embed:', error);
        setEmbedError(true);
      }
    }
  }, [video.embed_code, video.platform]);

  const loadReactionStats = async () => {
    try {
      const stats = await getVideoReactionStats(video.id);
      setReactionStats(stats);
    } catch (error) {
      console.error('Error loading reaction stats:', error);
    }
  };

  const handleReactionToggle = () => {
    if (onReactionUpdate) {
      onReactionUpdate();
    }
  };

  const handleCommentsOpen = () => {
    if (onCommentsOpen) {
      onCommentsOpen();
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return 'bg-[#000000] text-white';
      case 'instagram':
        return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white';
      case 'youtube':
        return 'bg-[#FF0000] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📷';
      case 'youtube':
        return '▶️';
      default:
        return '🎬';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-in fade-in-0 duration-300">
      {/* Close Button - Top Left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur-sm p-2.5 rounded-full hover:bg-black/90 transition-all active:scale-95 shadow-xl touch-manipulation"
        aria-label="Cerrar video"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Position Indicator - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>

      {/* Delete Button - Top Right (Owner Only) */}
      {isOwner && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(video.id);
            onClose();
          }}
          className="absolute top-4 right-4 z-30 bg-red-500/80 backdrop-blur-sm p-2.5 rounded-full hover:bg-red-500 transition-all active:scale-95 shadow-xl touch-manipulation"
          aria-label="Eliminar video"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Previous Button - Left Side */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/70 backdrop-blur-sm p-3 rounded-full hover:bg-black/90 transition-all active:scale-95 shadow-xl group touch-manipulation"
          aria-label="Video anterior"
        >
          <ChevronLeft className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Next Button - Right Side */}
      {currentIndex < videos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/70 backdrop-blur-sm p-3 rounded-full hover:bg-black/90 transition-all active:scale-95 shadow-xl group touch-manipulation"
          aria-label="Siguiente video"
        >
          <ChevronRight className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Video Embed Container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {!embedError ? (
          <div 
            ref={embedRef} 
            className="video-embed-container w-full h-full flex items-center justify-center"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              position: 'relative',
              zIndex: 10
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 max-w-md">
            <div className="text-6xl mb-2">
              {getPlatformIcon(video.platform)}
            </div>
            <p className="text-white text-center text-lg font-semibold">
              {video.platform === 'tiktok' 
                ? 'Video de TikTok'
                : 'No se pudo cargar el video'
              }
            </p>
            <p className="text-white/70 text-center text-sm">
              {video.platform === 'tiktok' 
                ? 'Los videos de TikTok no se pueden mostrar embebidos. Visita el enlace original.'
                : 'Intenta abrir el video en la plataforma original'
              }
            </p>
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white bg-primary px-6 py-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg"
            >
              Ver en {video.platform}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Mobile Reaction Bar - Right Side */}
      <MobileReactionBar
        videoId={video.id}
        reactions={video.reactions || []}
        currentUserId={currentUserId}
        reactionStats={reactionStats}
        onReactionToggle={handleReactionToggle}
        onCommentsOpen={handleCommentsOpen}
      />

      {/* Info Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-25 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
        {/* Platform Badge & View Link */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${getPlatformColor(video.platform)} text-xs shadow-lg`}>
            {getPlatformIcon(video.platform)} {video.platform.toUpperCase()}
          </Badge>
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex items-center gap-1 text-white/90 text-xs hover:text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          >
            Ver original
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-white text-sm mb-2 line-clamp-2 drop-shadow-lg">
            {video.description}
          </p>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {video.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-xs text-white border-white/50 bg-black/30 backdrop-blur-sm"
              >
                #{tag.name}
              </Badge>
            ))}
            {video.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs text-white border-white/50 bg-black/30 backdrop-blur-sm"
              >
                +{video.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
