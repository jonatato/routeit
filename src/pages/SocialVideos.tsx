import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Filter, Video as VideoIcon } from 'lucide-react';
import { VideoCard } from '../components/social/VideoCard';
import { VideoPreview } from '../components/social/VideoPreview';
import { VideoFullscreenModal } from '../components/social/VideoFullscreenModal';
import { VideoReactions } from '../components/social/VideoReactions';
import { VideoUploadDialog } from '../components/social/VideoUploadDialog';
import { VideoFilters } from '../components/social/VideoFilters';
import type { SocialVideo } from '../services/socialVideos';
import { fetchVideos, deleteVideo } from '../services/socialVideos';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Skeleton } from '../components/ui/skeleton';
import { PandaLogo } from '../components/PandaLogo';
import { useIsMobileShell } from '../hooks/useIsMobileShell';
import { useLocation } from 'react-router-dom';

interface Tag {
  id: string;
  name: string;
  slug: string;
  isCity?: boolean;
}

function SocialVideos() {
  const location = useLocation();
  const isMobile = useIsMobileShell();
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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<string | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
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
      const params = new URLSearchParams(location.search);
      const urlItineraryId = params.get('itineraryId');
      
      if (urlItineraryId) {
        setItineraryId(urlItineraryId);
      } else {
        const { data: ownedItineraries } = await supabase
          .from('itineraries')
          .select('id')
          .eq('user_id', currentUser.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (ownedItineraries && ownedItineraries.length > 0) {
          setItineraryId(ownedItineraries[0].id);
        } else {
          const { data: sharedItineraries } = await supabase
            .from('itinerary_collaborators')
            .select('itinerary_id, itineraries!inner(id, deleted_at)')
            .eq('user_id', currentUser.id)
            .is('itineraries.deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1);

          if (sharedItineraries && sharedItineraries.length > 0) {
            setItineraryId(sharedItineraries[0].itinerary_id);
          }
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

      const videosData = await fetchVideos(itineraryId);
      setVideos(videosData);

      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('name');

      const { data: locationsData } = await supabase
        .from('locations')
        .select('city')
        .eq('itinerary_id', itineraryId)
        .order('order_index');

      const cityTags = (locationsData || [])
        .filter((loc, idx, self) => self.findIndex(l => l.city === loc.city) === idx)
        .map((loc) => ({
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

  const handleCommentsOpen = (videoId: string) => {
    setSelectedVideoForComments(videoId);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedVideoIndex === null) return;
    
    if (direction === 'prev' && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    } else if (direction === 'next' && selectedVideoIndex < filteredVideos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const selectedVideo = selectedVideoIndex !== null 
    ? filteredVideos[selectedVideoIndex] 
    : null;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="text-6xl">🎥</div>
          <p className="text-sm text-mutedForeground">Cargando videos...</p>
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
    <div className={isMobile ? '' : 'container mx-auto p-6 space-y-6'}>
      {/* Desktop Header */}
      {!isMobile && (
        <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Videos de la Ruta
          </h1>
          <p className="text-muted-foreground mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} guardado{videos.length !== 1 ? 's' : ''}
          </p>
        </div>

            <Button onClick={() => setShowUploadDialog(true)} className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Video
          </Button>
        </div>

          {/* Desktop Filters */}
          {tags.length > 0 && (
            <VideoFilters
              tags={tags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              onClearFilters={() => setSelectedTags([])}
            />
          )}
        </>
      )}

      {/* Mobile Floating Buttons */}
      {isMobile && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {tags.length > 0 && (
            <button
              onClick={() => setShowFilters(true)}
              className="relative h-10 w-10 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 dark:hover:bg-primary/20 active:scale-95 transition-all shadow-lg"
              aria-label="Abrir filtros"
            >
              <Filter className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              {selectedTags.length > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{selectedTags.length}</span>
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => setShowUploadDialog(true)}
            className="h-10 w-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary active:scale-95 transition-all shadow-lg"
            aria-label="Agregar video"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Mobile Filters Modal */}
      {isMobile && (
        <VideoFilters
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearFilters={() => setSelectedTags([])}
          onClose={() => setShowFilters(false)}
          isOpen={showFilters}
        />
      )}

      {/* Videos Container */}
      {filteredVideos.length > 0 ? (
        <div className={
          isMobile
            ? 'grid grid-cols-2 gap-2 p-2 pb-20' // Mobile: grid 2 columns
            : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // Desktop: grid 2-4 columns
        }>
          {filteredVideos.map((video, index) => (
            // Both mobile and desktop: Preview that opens fullscreen modal
            <VideoPreview
              key={video.id}
                video={video}
              onClick={() => setSelectedVideoIndex(index)}
              />
          ))}
        </div>
      ) : (
        <div className={isMobile ? 'min-h-screen flex items-center justify-center p-6' : ''}>
          <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
            <VideoIcon className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedTags.length > 0
                  ? 'No hay videos con estos filtros'
                  : 'Aún no hay videos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedTags.length > 0
                  ? 'Prueba con otros filtros o agrega nuevos videos'
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
        </div>
      )}

      {/* Fullscreen Video Modal - Both Mobile and Desktop */}
      {selectedVideo && selectedVideoIndex !== null && (
        <VideoFullscreenModal
          video={selectedVideo}
          currentUserId={currentUser?.id}
          isOwner={currentUser?.id === selectedVideo.user_id}
          onClose={() => setSelectedVideoIndex(null)}
          onDelete={initiateDelete}
          onReactionUpdate={loadData}
          onCommentsOpen={() => handleCommentsOpen(selectedVideo.id)}
          videos={filteredVideos}
          currentIndex={selectedVideoIndex}
          onNavigate={handleNavigate}
        />
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

      {/* Comments Modal for Mobile */}
      {isMobile && selectedVideoForComments && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-end"
          onClick={() => setSelectedVideoForComments(null)}
        >
          <div 
            className="bg-background rounded-t-3xl w-full max-h-[70vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
            <VideoReactions
              videoId={selectedVideoForComments}
              reactions={videos.find(v => v.id === selectedVideoForComments)?.reactions || []}
              currentUserId={currentUser?.id}
              onReactionAdded={() => {
                loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialVideos;
