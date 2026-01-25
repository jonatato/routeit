import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import ItineraryView from '../components/ItineraryView';
import { chinaTrip } from '../data/itinerary';
import { supabase } from '../lib/supabase';
import { fetchItineraryById, fetchUserItinerary, seedUserItinerary } from '../services/itinerary';

function DynamicItinerary() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<typeof chinaTrip | null>(null);
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setError('No hay sesión activa.');
        setIsLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams(location.search);
        const itineraryId = params.get('itineraryId');
        let dataItinerary = itineraryId ? await fetchItineraryById(itineraryId) : await fetchUserItinerary(user.id);
        if (!dataItinerary) {
          dataItinerary = await seedUserItinerary(user.id, chinaTrip);
        }
        setItinerary(dataItinerary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el itinerario.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">Cargando itinerario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-mutedForeground">{error}</p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  if (!itinerary) {
    return null;
  }

  return (
    <div className="relative">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2 px-4 pt-4">
        <Link to="/app/admin" aria-label="Administrar">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" />
          <span className="ml-2">Salir</span>
        </Button>
      </div>
      <ItineraryView itinerary={itinerary} editable />
    </div>
  );
}

export default DynamicItinerary;
