import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PandaLogo } from '../components/PandaLogo';
import ItineraryView from '../components/ItineraryView';
import FullscreenLoader from '../components/FullscreenLoader';
import { supabase } from '../lib/supabase';
import { fetchItineraryById, fetchUserItinerary } from '../services/itinerary';
import type { TravelItinerary } from '../data/itinerary';

function DynamicItinerary() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [hasNoItineraries, setHasNoItineraries] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setHasNoItineraries(false);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setError('No hay sesión activa.');
        setIsLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams(location.search);
        const queryItineraryId = params.get('itineraryId');

        const dataItinerary = queryItineraryId
          ? await fetchItineraryById(queryItineraryId)
          : await fetchUserItinerary(user.id);

        if (!dataItinerary) {
          setHasNoItineraries(true);
          setItinerary(null);
        } else {
          setItinerary(dataItinerary);
          setHasNoItineraries(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'No se pudo cargar el itinerario.';
        console.error('Error cargando itinerario:', errorMessage);
        setError(errorMessage);
        setItinerary(null);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [location.search]);

  if (isLoading) {
    return <FullscreenLoader message="Cargando itinerario..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-mutedForeground">{error}</p>
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  if (hasNoItineraries) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center">
          <PandaLogo size="lg" className="mb-4" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">¡Aún no tienes viajes!</h1>
            <p className="max-w-md text-lg text-mutedForeground">
              Crea tu primer itinerario personalizado y comienza a planificar tu viaje perfecto.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/app/itineraries">
                <Button size="lg" className="w-full sm:w-auto">
                  Crear mi primer itinerario
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => void supabase.auth.signOut()} className="w-full sm:w-auto">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return null;
  }

  return (
    <div className="relative">
      <ItineraryView itinerary={itinerary} editable />
    </div>
  );
}

export default DynamicItinerary;
