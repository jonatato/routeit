import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Grid3x3, List, Filter, Video as VideoIcon } from 'lucide-react';
import { VideoCard } from '../components/social/VideoCard';
import { VideoReactions } from '../components/social/VideoReactions';
import { VideoUploadDialog } from '../components/social/VideoUploadDialog';
import type { SocialVideo } from '../services/socialVideos';
import { 
  fetchVideos, 
  filterVideosByTags, 
  deleteVideo
} from '../services/socialVideos';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Skeleton } from '../components/ui/skeleton';
import { PandaLogo } from '../components/PandaLogo';

interface Tag {
  id: string;
  name: string;
  slug: string;
  isCity?: boolean;
}

function SocialVideos() {
  const location = useLocation();
  const [videos, setVideos] = useState<SocialVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<SocialVideo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'embed' | 'thumbnail'>('embed');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadItineraryId();
    }
  }, [currentUser, location.search]);

  useEffect(() => {
    if (itineraryId) {
      loadData();
    }
  }, [itineraryId]);

  useEffect(() => {
    applyFilters();
  }, [videos, selectedTags]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadItineraryId = async () => {
    try {
      // Get itinerary ID from URL or fetch the most recent one
      const params = new URLSearchParams(location.search);
      const urlItineraryId = params.get('itineraryId');
      
      if (urlItineraryId) {
        setItineraryId(urlItineraryId);
      } else {
        // Fetch most recent itinerary
        const { data: itineraries } = await supabase
          .from('itineraries')
          .select('id')
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (itineraries && itineraries.length > 0) {
          setItineraryId(itineraries[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading itinerary ID:', error);
    }
  };

  const loadData = async () => {
    if (!itineraryId) return;

    try {
      setLoading(true);

      // Load videos
      const videosData = await fetchVideos(itineraryId);
      setVideos(videosData);

      // Load tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('name');

      // Load cities from itinerary locations as special tags
      const { data: locationsData } = await supabase
        .from('locations')
        .select('city')
        .eq('itinerary_id', itineraryId)
        .order('order_index');

      // Combine regular tags and city tags
      const cityTags = (locationsData || []).map((loc, idx) => ({
        id: `city-${loc.city}`,
        name: `📍 ${loc.city}`,
        slug: loc.city.toLowerCase().replace(/\s+/g, '-'),
        isCity: true
      }));

      const allTags = [...(tagsData || []), ...cityTags];
      setTags(allTags);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar videos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (selectedTags.length === 0) {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(video => 
        video.tags?.some(tag => selectedTags.includes(tag.id))
      );
      setFilteredVideos(filtered);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideo(videoToDelete);
      toast.success('Video eliminado');
      await loadData();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error al eliminar video');
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };

  const initiateDelete = (videoId: string) => {
    setVideoToDelete(videoId);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[600px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!itineraryId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <PandaLogo size="2xl" className="mb-6" />
        <h2 className="text-2xl font-bold mb-2">No hay itinerarios</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Crea un itinerario primero para poder agregar tus videos favoritos del viaje.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <VideoIcon className="h-8 w-8 text-primary" />
            Videos de la Ruta
          </h1>
          <p className="text-muted-foreground mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} guardado{videos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'embed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('embed')}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'thumbnail' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('thumbnail')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Video Button */}
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Video
          </Button>
        </div>
      </div>

      {/* Filters */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar por tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  #{tag.name}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="h-6 text-xs"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid/List */}
      {filteredVideos.length > 0 ? (
        <div className={
          viewMode === 'embed'
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }>
          {filteredVideos.map(video => (
            <div key={video.id} className="space-y-4">
              <VideoCard
                video={video}
                mode={viewMode}
                onDelete={initiateDelete}
                currentUserId={currentUser?.id}
              />
              <VideoReactions
                videoId={video.id}
                reactions={video.reactions || []}
                currentUserId={currentUser?.id}
                onReactionAdded={loadData}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <VideoIcon className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedTags.length > 0
                  ? 'No hay videos con estos tags'
                  : 'Aún no hay videos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedTags.length > 0
                  ? 'Prueba con otros filtros'
                  : 'Agrega tus primeros TikToks, Reels o YouTube Shorts del viaje'}
              </p>
              {selectedTags.length === 0 && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Video
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Upload Dialog */}
      {currentUser && itineraryId && (
        <VideoUploadDialog
          itineraryId={itineraryId}
          userId={currentUser.id}
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar video"
        message="¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDeleteVideo}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setVideoToDelete(null);
        }}
        variant="destructive"
      />
    </div>
  );
}

export default SocialVideos;
