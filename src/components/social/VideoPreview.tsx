import { Badge } from '../ui/badge';
import { Play } from 'lucide-react';
import type { SocialVideo } from '../../services/socialVideos';

interface VideoPreviewProps {
  video: SocialVideo;
  onClick: () => void;
}

export function VideoPreview({ video, onClick }: VideoPreviewProps) {
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
    <button
      onClick={onClick}
      className="relative aspect-[9/16] rounded-lg overflow-hidden group active:scale-95 transition-transform shadow-md hover:shadow-xl"
    >
      {/* Thumbnail Image */}
      <img
        src={video.thumbnail_url || 'https://placehold.co/400x600/9b87f5/ffffff?text=Video'}
        alt={video.description || 'Video thumbnail'}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Play Button Center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Platform Badge - Top Left */}
      <div className="absolute top-2 left-2">
        <Badge className={`${getPlatformColor(video.platform)} text-xs shadow-lg`}>
          {getPlatformIcon(video.platform)}
        </Badge>
      </div>

      {/* Info Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
        {/* Description */}
        {video.description && (
          <p className="text-white text-xs font-medium mb-1 line-clamp-2 drop-shadow-lg">
            {video.description}
          </p>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {video.tags.slice(0, 2).map((tag) => (
              <span 
                key={tag.id} 
                className="text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded"
              >
                #{tag.name}
              </span>
            ))}
            {video.tags.length > 2 && (
              <span className="text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded">
                +{video.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Reaction Count */}
        {video.reactions && video.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-white/90 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded">
              ❤️ {video.reactions.length}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
