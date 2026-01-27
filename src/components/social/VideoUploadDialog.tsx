import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { X, Plus, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { parseVideoUrl, generateThumbnailUrl, addVideo, addVideoTags } from '../../services/socialVideos';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface VideoUploadDialogProps {
  itineraryId: string;
  userId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export function VideoUploadDialog({ 
  itineraryId, 
  userId, 
  open, 
  onClose, 
  onSuccess 
}: VideoUploadDialogProps) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<{
    platform: string;
    videoId: string;
    thumbnailUrl: string;
  } | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open, itineraryId]);

  useEffect(() => {
    if (url) {
      validateAndPreview(url);
    } else {
      setPreview(null);
      setError(null);
    }
  }, [url]);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

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
      const slug = newTagName.trim().toLowerCase().replace(/\s+/g, '-');
      
      const { data, error } = await supabase
        .from('tags')
        .insert({
          itinerary_id: itineraryId,
          name: newTagName.trim(),
          slug,
        })
        .select()
        .single();

      if (error) throw error;

      setAvailableTags([...availableTags, data]);
      setSelectedTags([...selectedTags, data.id]);
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
      
      // Agregar video
      const video = await addVideo(itineraryId, userId, url, description || undefined);
      
      // Agregar tags si hay
      if (selectedTags.length > 0) {
        await addVideoTags(video.id, selectedTags);
      }

      toast.success('¡Video agregado!');
      
      // Resetear form
      setUrl('');
      setDescription('');
      setSelectedTags([]);
      setPreview(null);
      setError(null);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding video:', error);
      toast.error(error.message || 'Error al agregar video');
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agregar Video</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              URL del Video
            </label>
            <input
              type="url"
              placeholder="https://www.tiktok.com/@username/video/123... o Instagram Reel o YouTube Short"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Soportamos TikTok, Instagram Reels y YouTube Shorts
            </p>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista Previa</label>
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <img
                  src={preview.thumbnailUrl}
                  alt="Preview"
                  className="w-24 h-32 object-cover rounded"
                />
                <div className="flex-1 space-y-2">
                  <Badge className={getPlatformColor(preview.platform)}>
                    {preview.platform.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
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
            <label className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Agrega una descripción o comentario sobre este video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
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

            {/* Available Tags */}
            {availableTags.length > 0 && (
              <div className="flex gap-2 flex-wrap p-3 bg-muted rounded-md">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag.id))
                  .map(tag => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-white"
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name} <Plus className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
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
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
            >
              {loading ? 'Agregando...' : 'Agregar Video'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
