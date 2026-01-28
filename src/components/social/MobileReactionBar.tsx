import { useState } from 'react';
import { Heart, Flame, Laugh, ThumbsUp, MessageCircle } from 'lucide-react';
import { addReaction, deleteReaction } from '../../services/socialVideos';
import type { VideoReaction } from '../../services/socialVideos';
import { useToast } from '../../hooks/useToast';

interface MobileReactionBarProps {
  videoId: string;
  reactions: VideoReaction[];
  currentUserId?: string;
  reactionStats: Record<string, number>;
  onReactionToggle: () => void;
  onCommentsOpen: () => void;
}

const reactionConfig = {
  like: { 
    icon: ThumbsUp, 
    color: 'text-blue-500',
    activeColor: 'bg-blue-500 text-white',
    emoji: '👍'
  },
  love: { 
    icon: Heart, 
    color: 'text-red-500',
    activeColor: 'bg-red-500 text-white',
    emoji: '❤️'
  },
  fire: { 
    icon: Flame, 
    color: 'text-orange-500',
    activeColor: 'bg-orange-500 text-white',
    emoji: '🔥'
  },
  laugh: { 
    icon: Laugh, 
    color: 'text-yellow-500',
    activeColor: 'bg-yellow-500 text-white',
    emoji: '😂'
  },
};

export function MobileReactionBar({
  videoId,
  reactions,
  currentUserId,
  reactionStats,
  onReactionToggle,
  onCommentsOpen,
}: MobileReactionBarProps) {
  const [loading, setLoading] = useState(false);
  const [pulsingButton, setPulsingButton] = useState<string | null>(null);
  const toast = useToast();

  const userReaction = reactions.find(
    r => r.user_id === currentUserId && !r.comment
  );

  const handleReactionClick = async (
    reactionType: 'like' | 'love' | 'fire' | 'laugh'
  ) => {
    if (!currentUserId) {
      toast.error('Debes iniciar sesión para reaccionar');
      return;
    }

    try {
      setLoading(true);
      setPulsingButton(reactionType);

      const existingReaction = reactions.find(
        r => r.user_id === currentUserId && r.reaction_type === reactionType && !r.comment
      );

      if (existingReaction) {
        await deleteReaction(existingReaction.id);
      } else {
        await addReaction(videoId, currentUserId, reactionType);
      }

      onReactionToggle();
      
      // Animation cleanup
      setTimeout(() => setPulsingButton(null), 300);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Error al reaccionar');
    } finally {
      setLoading(false);
    }
  };

  const commentsCount = reactions.filter(r => r.comment).length;

  return (
    <div className="absolute right-4 bottom-32 flex flex-col gap-3 z-30">
      {/* Reaction Buttons */}
      {(Object.keys(reactionConfig) as Array<keyof typeof reactionConfig>).map((type) => {
        const config = reactionConfig[type];
        const Icon = config.icon;
        const count = reactionStats[type] || 0;
        const isActive = userReaction?.reaction_type === type;
        const isPulsing = pulsingButton === type;

        return (
          <button
            key={type}
            onClick={() => handleReactionClick(type)}
            disabled={loading}
            className={`
              flex flex-col items-center gap-1 group
              ${isPulsing ? 'animate-pulse' : ''}
            `}
            aria-label={`${type} reaction`}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300 transform
                ${isActive 
                  ? config.activeColor + ' shadow-lg scale-110' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                }
                active:scale-95
              `}
            >
              <Icon 
                className={`h-6 w-6 ${isActive ? 'text-white' : config.color}`}
                strokeWidth={2.5}
              />
            </div>
            {count > 0 && (
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {count > 999 ? `${Math.floor(count / 1000)}k` : count}
              </span>
            )}
          </button>
        );
      })}

      {/* Comments Button */}
      <button
        onClick={onCommentsOpen}
        className="flex flex-col items-center gap-1 group"
        aria-label="Open comments"
      >
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 active:scale-95">
          <MessageCircle className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        {commentsCount > 0 && (
          <span className="text-xs font-bold text-white drop-shadow-lg">
            {commentsCount > 999 ? `${Math.floor(commentsCount / 1000)}k` : commentsCount}
          </span>
        )}
      </button>
    </div>
  );
}
