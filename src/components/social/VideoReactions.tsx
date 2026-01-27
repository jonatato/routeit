import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Heart, Flame, Laugh, ThumbsUp, MessageCircle, Trash2 } from 'lucide-react';
import type { VideoReaction } from '../../services/socialVideos';
import { 
  addReaction, 
  deleteReaction, 
  getVideoReactionStats 
} from '../../services/socialVideos';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface VideoReactionsProps {
  videoId: string;
  reactions: VideoReaction[];
  currentUserId?: string;
  onReactionAdded?: () => void;
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  fire: Flame,
  laugh: Laugh,
};

const reactionColors = {
  like: 'text-blue-500',
  love: 'text-red-500',
  fire: 'text-orange-500',
  laugh: 'text-yellow-500',
};

export function VideoReactions({ 
  videoId, 
  reactions, 
  currentUserId,
  onReactionAdded 
}: VideoReactionsProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<'like' | 'love' | 'fire' | 'laugh' | null>(null);
  const [reactionStats, setReactionStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadReactionStats();
  }, [reactions]);

  const loadReactionStats = async () => {
    try {
      const stats = await getVideoReactionStats(videoId);
      setReactionStats(stats);
    } catch (error) {
      console.error('Error loading reaction stats:', error);
    }
  };

  const handleReactionClick = async (reactionType: 'like' | 'love' | 'fire' | 'laugh') => {
    if (!currentUserId) {
      showToast('Debes iniciar sesión para reaccionar', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Si ya reaccionó con este tipo, eliminar la reacción
      const existingReaction = reactions.find(
        r => r.user_id === currentUserId && r.reaction_type === reactionType && !r.comment
      );
      
      if (existingReaction) {
        await deleteReaction(existingReaction.id);
        setSelectedReaction(null);
        showToast('Reacción eliminada', 'success');
      } else {
        // Agregar nueva reacción
        await addReaction(videoId, currentUserId, reactionType);
        setSelectedReaction(reactionType);
        showToast('¡Reacción agregada!', 'success');
      }
      
      if (onReactionAdded) onReactionAdded();
      await loadReactionStats();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      showToast('Error al reaccionar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUserId) {
      showToast('Debes iniciar sesión para comentar', 'error');
      return;
    }

    if (!newComment.trim()) {
      showToast('Escribe un comentario', 'error');
      return;
    }

    try {
      setLoading(true);
      await addReaction(videoId, currentUserId, selectedReaction || 'like', newComment);
      setNewComment('');
      showToast('Comentario agregado', 'success');
      
      if (onReactionAdded) onReactionAdded();
      await loadReactionStats();
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Error al comentar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (reactionId: string) => {
    try {
      setLoading(true);
      await deleteReaction(reactionId);
      showToast('Comentario eliminado', 'success');
      
      if (onReactionAdded) onReactionAdded();
      await loadReactionStats();
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Error al eliminar comentario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const commentsWithText = reactions.filter(r => r.comment);
  const userReaction = reactions.find(r => r.user_id === currentUserId && !r.comment);

  return (
    <div className="space-y-4">
      {/* Reaction Buttons */}
      <div className="flex items-center gap-2">
        {(Object.keys(reactionIcons) as Array<keyof typeof reactionIcons>).map((type) => {
          const Icon = reactionIcons[type];
          const count = reactionStats[type] || 0;
          const isActive = userReaction?.reaction_type === type;

          return (
            <Button
              key={type}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReactionClick(type)}
              disabled={loading}
              className={`gap-2 ${isActive ? 'bg-primary' : ''}`}
            >
              <Icon 
                className={`h-4 w-4 ${isActive ? 'text-white' : reactionColors[type]}`} 
              />
              {count > 0 && <span className="text-xs">{count}</span>}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2 ml-auto"
        >
          <MessageCircle className="h-4 w-4" />
          {commentsWithText.length > 0 && (
            <span className="text-xs">{commentsWithText.length}</span>
          )}
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Comentarios ({commentsWithText.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comment List */}
            {commentsWithText.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {commentsWithText.map((reaction) => {
                  const ReactionIcon = reactionIcons[reaction.reaction_type];
                  const isOwner = reaction.user_id === currentUserId;

                  return (
                    <div 
                      key={reaction.id} 
                      className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <ReactionIcon 
                          className={`h-4 w-4 ${reactionColors[reaction.reaction_type]}`} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {reaction.user_name || 'Usuario'}
                        </p>
                        <p className="text-sm text-foreground break-words">
                          {reaction.comment}
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(reaction.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </p>
            )}

            {/* Add Comment */}
            {currentUserId && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex gap-2">
                  {(Object.keys(reactionIcons) as Array<keyof typeof reactionIcons>).map((type) => {
                    const Icon = reactionIcons[type];
                    const isSelected = selectedReaction === type;

                    return (
                      <Button
                        key={type}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedReaction(type)}
                        className="h-8 px-2"
                      >
                        <Icon 
                          className={`h-3 w-3 ${isSelected ? 'text-white' : reactionColors[type]}`} 
                        />
                      </Button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
