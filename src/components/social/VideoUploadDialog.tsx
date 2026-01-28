import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { X, Plus, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { parseVideoUrl, generateThumbnailUrl, addVideo, addVideoTags } from '../../services/socialVideos';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useIsMobileShell } from '../../hooks/useIsMobileShell';

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
  isCity?: boolean;
}

export function VideoUploadDialog({ 
  itineraryId, 
  userId, 
  open, 
  onClose, 
  onSuccess 
}: VideoUploadDialogProps) {
  const isMobile = useIsMobileShell();
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

      const { data: locationsData } = await supabase
        .from('locations')
        .select('city')
        .eq('itinerary_id', itineraryId)
        .order('order_index');

      const cityTags = (locationsData || [])
        .filter((loc, idx, self) => self.findIndex(l => l.city === loc.city) === idx)
        .map(loc => ({
          id: `city-${loc.city}`,
          name: `📍 ${loc.city}`,
          slug: loc.city.toLowerCase().replace(/\s+/g, '-'),
          isCity: true
        }));

      const allTags = [...(data || []), ...cityTags];
      setAvailableTags(allTags);
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
      
      const video = await addVideo(itineraryId, userId, url, description || undefined);
      
      if (selectedTags.length > 0) {
        const tagIds: string[] = [];
        
        for (const tagId of selectedTags) {
          if (tagId.startsWith('city-')) {
            const cityName = tagId.replace('city-', '');
            const slug = cityName.toLowerCase().replace(/\s+/g, '-');
            
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('itinerary_id', itineraryId)
              .eq('slug', slug)
              .single();
            
            if (existingTag) {
              tagIds.push(existingTag.id);
            } else {
              const { data: newTag } = await supabase
                .from('tags')
                .insert({
                  itinerary_id: itineraryId,
                  name: `📍 ${cityName}`,
                  slug,
                })
                .select('id')
                .single();
              
              if (newTag) {
                tagIds.push(newTag.id);
              }
            }
          } else {
            tagIds.push(tagId);
          }
        }
        
        if (tagIds.length > 0) {
          await addVideoTags(video.id, tagIds);
        }
      }

      toast.success('¡Video agregado!');
      
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

  const cityTags = availableTags.filter(t => t.isCity);
  const customTags = availableTags.filter(t => !t.isCity);

  // Mobile: Fullscreen dialog
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-foreground">Agregar Video</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-24">
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
                      {tag.isCity ? tag.name : `#${tag.name}`} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* City Tags */}
            {cityTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">📍 Ciudades de la Ruta</p>
                <div className="flex gap-2 flex-wrap">
                  {cityTags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors active:scale-95"
                      >
                        {tag.name} <Plus className="inline h-3 w-3 ml-1" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Custom Tags */}
            {customTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">🏷️ Tags Personalizados</p>
                <div className="flex gap-2 flex-wrap">
                  {customTags
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
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-2">
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
                      {tag.isCity ? tag.name : `#${tag.name}`} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* City Tags Section */}
            {cityTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">📍 Ciudades de la Ruta</p>
                <div className="flex gap-2 flex-wrap p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  {cityTags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-500 hover:text-white border-blue-300 transition-colors"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name} <Plus className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Regular Tags Section */}
            {customTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">🏷️ Tags Personalizados</p>
                <div className="flex gap-2 flex-wrap p-3 bg-muted rounded-lg">
                  {customTags
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
