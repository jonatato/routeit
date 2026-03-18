import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { X, Plus, ExternalLink, AlertCircle } from 'lucide-react';
import {
  addVideo,
  createVideoTag,
  generateThumbnailUrl,
  parseVideoUrl,
  replaceVideoTags,
  type SocialVideoTag,
} from '../../services/socialVideos';
import { useToast } from '../../hooks/useToast';
import { useIsMobileShell } from '../../hooks/useIsMobileShell';

interface VideoUploadDialogProps {
  itineraryId: string;
  userId: string;
  availableTags: SocialVideoTag[];
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onTagCreated?: (tag: SocialVideoTag) => void;
}

export function VideoUploadDialog({ 
  itineraryId, 
  userId, 
  availableTags,
  open, 
  onClose, 
  onSuccess,
  onTagCreated,
}: VideoUploadDialogProps) {
  const isMobile = useIsMobileShell();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<{
    platform: string;
    videoId: string;
    thumbnailUrl: string;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setSelectedTags([]);
      setNewTagName('');
      setUrl('');
      setDescription('');
      setPreview(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setSelectedTags(prev => prev.filter(tagId => availableTags.some(tag => tag.id === tagId)));
  }, [availableTags]);

  useEffect(() => {
    if (url) {
      validateAndPreview(url);
    } else {
      setPreview(null);
      setError(null);
    }
  }, [url]);

  const validateAndPreview = (videoUrl: string) => {
    const parsed = parseVideoUrl(videoUrl);
    
    if (!parsed) {
      setError('URL no válida. Soportamos TikTok, Instagram Reels y YouTube Shorts.');
      setPreview(null);
      return;
    }

    const thumbnailUrl = generateThumbnailUrl(parsed.platform, parsed.videoId);
    setPreview({
      platform: parsed.platform,
      videoId: parsed.videoId,
      thumbnailUrl,
    });
    setError(null);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const createdTag = await createVideoTag(itineraryId, newTagName.trim());
      onTagCreated?.(createdTag);
      setSelectedTags(prev => (prev.includes(createdTag.id) ? prev : [...prev, createdTag.id]));
      setNewTagName('');
      toast.success('Tag creado');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Error al crear tag');
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async () => {
    if (!url || !preview) {
      toast.error('Ingresa una URL válida');
      return;
    }

    try {
      setLoading(true);
      
      const video = await addVideo(itineraryId, userId, url, description || undefined);
      
      if (selectedTags.length > 0) {
        await replaceVideoTags(video.id, selectedTags);
      }

      toast.success('¡Video agregado!');
      
      setUrl('');
      setDescription('');
      setSelectedTags([]);
      setPreview(null);
      setError(null);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error adding video:', error);
      toast.error(error instanceof Error ? error.message : 'Error al agregar video');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return 'bg-black text-white';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'youtube':
        return 'bg-red-600 text-white';
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

  if (!open) return null;

  // Mobile: Fullscreen dialog
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-4 pt-safe-top">
          <h2 className="text-xl font-bold text-foreground">Agregar Video</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-4 pb-24">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              URL del Video *
            </label>
            <input
              type="url"
              placeholder="Pega aquí el enlace del TikTok, Reel o Short..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
            />
            <p className="text-xs text-muted-foreground">
              ✨ Soportamos TikTok, Instagram Reels y YouTube Shorts
            </p>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Vista Previa</label>
              <div className="flex gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl border border-primary/20">
                <img
                  src={preview.thumbnailUrl}
                  alt="Preview"
                  className="w-24 h-32 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1 space-y-2">
                  <Badge className={`${getPlatformColor(preview.platform)} shadow-sm`}>
                    {getPlatformIcon(preview.platform)} {preview.platform.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {preview.videoId}
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                  >
                    Ver original
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Descripción
            </label>
            <textarea
              placeholder="¿Qué hace especial este video? Cuéntanos más..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Tags</label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex gap-2 flex-wrap p-3 bg-primary/10 rounded-xl border border-primary/20">
                {selectedTags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge
                      key={tag.id}
                      variant="default"
                      className="cursor-pointer shadow-sm"
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">🏷️ Tags del Video</p>
                <div className="flex gap-2 flex-wrap">
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="px-3 py-1.5 text-sm bg-muted text-foreground border border-border rounded-full hover:bg-accent transition-colors active:scale-95"
                      >
                        #{tag.name} <Plus className="inline h-3 w-3 ml-1" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Crear nuevo tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                className="flex-1 px-4 py-2 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-4"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer - Sticky bottom */}
        <div className="fixed bottom-0 left-0 right-0 flex gap-2 border-t border-border bg-background p-4 pb-safe pl-safe pr-safe">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !preview || !!error}
            className="flex-1"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: Modal centered
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-2xl">Agregar Video</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              URL del Video *
            </label>
            <input
              type="url"
              placeholder="https://www.tiktok.com/@username/video/123... o Instagram Reel o YouTube Short"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              ✨ Soportamos TikTok, Instagram Reels y YouTube Shorts
            </p>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Vista Previa</label>
              <div className="flex gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl border border-primary/20">
                <img
                  src={preview.thumbnailUrl}
                  alt="Preview"
                  className="w-32 h-44 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1 space-y-2">
                  <Badge className={getPlatformColor(preview.platform)}>
                    {getPlatformIcon(preview.platform)} {preview.platform.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground font-mono">
                    Video ID: {preview.videoId}
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Ver original
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Agrega una descripción o comentario sobre este video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Tags</label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex gap-2 flex-wrap p-3 bg-primary/10 rounded-xl">
                {selectedTags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge
                      key={tag.id}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">🏷️ Tags del Video</p>
                <div className="flex gap-2 flex-wrap p-3 bg-muted rounded-lg">
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                        onClick={() => toggleTag(tag.id)}
                      >
                        #{tag.name} <Plus className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Crear nuevo tag personalizado..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !preview || !!error}
              className="shadow-lg"
            >
              {loading ? 'Agregando...' : 'Agregar Video'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
