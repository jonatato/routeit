import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MapPin, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { fetchUserItinerary } from '../services/itinerary';

interface Favorite {
  id: string;
  type: 'place' | 'restaurant' | 'activity' | 'hotel';
  name: string;
  location: string;
  description: string;
  rating?: number;
  imageUrl?: string;
}

function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Fetch itinerary
        const itinerary = await fetchUserItinerary(user.id);
        if (!itinerary) {
          setFavorites([]);
          return;
        }

        // Get favorite IDs from localStorage
        const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
        const favoriteIds: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];

        if (favoriteIds.length === 0) {
          setFavorites([]);
          return;
        }

        // Get favorites from schedule items and locations
        const { data: scheduleItems, error: scheduleError } = await supabase
          .from('schedule_items')
          .select('*, days!inner(itinerary_id)')
          .eq('days.itinerary_id', itinerary.id)
          .in('id', favoriteIds);

        if (scheduleError) throw scheduleError;

        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('itinerary_id', itinerary.id)
          .in('id', favoriteIds);

        if (locationsError) throw locationsError;

        // Map to Favorite type
        const favs: Favorite[] = [];

        scheduleItems?.forEach(item => {
          favs.push({
            id: item.id,
            type: item.kind === 'food' ? 'restaurant' : 'activity',
            name: item.title || '',
            location: item.location || '',
            description: item.description || '',
            rating: 4.5, // Default rating
          });
        });

        locations?.forEach(loc => {
          favs.push({
            id: loc.id,
            type: 'place',
            name: loc.city || '',
            location: loc.region || '',
            description: '',
            rating: 4.5, // Default rating
          });
        });

        setFavorites(favs);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [navigate]);

  const removeFavorite = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Remove from localStorage
    const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
    const favoriteIds: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
    const updatedIds = favoriteIds.filter(fid => fid !== id);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedIds));

    // Update state
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  const typeLabels = {
    place: 'Lugar',
    restaurant: 'Restaurante',
    activity: 'Actividad',
    hotel: 'Hotel',
  };

  const typeColors = {
    place: 'default',
    restaurant: 'secondary',
    activity: 'accent',
    hotel: 'primary',
  } as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="border-b border-border bg-white px-4 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Favoritos</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          <h1 className="text-3xl font-bold">Favoritos</h1>
          <p className="text-muted-foreground">Tus lugares y actividades guardados</p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Aún no tienes favoritos guardados.
                <br />
                Explora lugares y guárdalos aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map(favorite => (
              <Card key={favorite.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={typeColors[favorite.type]}>
                          {typeLabels[favorite.type]}
                        </Badge>
                        {favorite.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{favorite.rating}</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl">{favorite.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {favorite.location}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500"
                      onClick={() => removeFavorite(favorite.id)}
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{favorite.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
