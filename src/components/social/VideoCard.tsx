import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { SocialVideo } from '../../services/socialVideos';

interface VideoCardProps {
  video: SocialVideo;
  mode: 'embed' | 'thumbnail';
  onDelete?: (videoId: string) => void;
  onEdit?: (videoId: string) => void;
  currentUserId?: string;
}

export function VideoCard({ video, mode, onDelete, onEdit, currentUserId }: VideoCardProps) {
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUserId === video.user_id;

  useEffect(() => {
    if (mode === 'embed' && video.embed_code && embedRef.current) {
      // Limpiar contenido previo
      embedRef.current.innerHTML = '';
      
      try {
        embedRef.current.innerHTML = video.embed_code;
        setEmbedLoaded(true);
        
        // Si es TikTok, reinicializar el script embed
        if (video.platform === 'tiktok' && (window as any).tiktokEmbed) {
          setTimeout(() => {
            (window as any).tiktokEmbed?.process();
          }, 100);
        }
      } catch (error) {
        console.error('Error loading embed:', error);
        setEmbedError(true);
      }
    }
  }, [mode, video.embed_code, video.platform]);

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

  if (mode === 'embed') {
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-0">
          {/* Video Embed */}
          <div className="relative bg-gray-100 flex items-center justify-center min-h-[600px]">
            {!embedError ? (
              <div 
                ref={embedRef} 
                className="w-full h-full flex items-center justify-center"
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 p-8">
                <p className="text-muted-foreground">No se pudo cargar el video embebido</p>
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  Ver en {video.platform}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="p-4 space-y-3">
            {/* Platform Badge */}
            <div className="flex items-center gap-2">
              <Badge className={`${getPlatformColor(video.platform)} text-xs`}>
                {getPlatformIcon(video.platform)} {video.platform.toUpperCase()}
              </Badge>
              {video.tags && video.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {video.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-sm text-foreground">{video.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Ver original
              </a>
              
              {isOwner && (
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(video.id)}
                      className="h-8 px-2"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(video.id)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Thumbnail mode
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <div className="relative w-32 h-48 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={video.thumbnail_url || 'https://placehold.co/400x600/9b87f5/ffffff?text=Video'}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <ExternalLink className="h-8 w-8 text-white" />
              </div>
            </div>
          </a>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Badge className={`${getPlatformColor(video.platform)} text-xs`}>
                {getPlatformIcon(video.platform)} {video.platform.toUpperCase()}
              </Badge>
              
              {isOwner && (
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(video.id)}
                      className="h-7 px-2"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(video.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {video.description && (
              <p className="text-sm text-foreground line-clamp-3">{video.description}</p>
            )}

            {video.tags && video.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {video.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver en {video.platform}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
