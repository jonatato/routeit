import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { PandaLogo } from '../components/PandaLogo';
import ItineraryView from '../components/ItineraryView';
import { NotificationBell } from '../components/NotificationBell';
import { supabase } from '../lib/supabase';
import { fetchItineraryById, fetchUserItinerary } from '../services/itinerary';
import type { TravelItinerary } from '../data/itinerary';

function DynamicItinerary() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [hasNoItineraries, setHasNoItineraries] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
        // Primero intentamos obtener el ID de la URL query params
        const params = new URLSearchParams(location.search);
        const queryItineraryId = params.get('itineraryId');
        
        let dataItinerary = queryItineraryId ? await fetchItineraryById(queryItineraryId) : await fetchUserItinerary(user.id);
        
        if (!dataItinerary) {
          // Si no hay itinerario en BD, mostrar mensaje
          setHasNoItineraries(true);
          setItinerary(null);
        } else {
          setItinerary(dataItinerary);
          setHasNoItineraries(false);
          
          // Actualizar la URL para que muestre el ID del itinerario cargado
          // Solo si no está ya en la URL
          const currentPath = location.pathname + location.search;
          if (!currentPath.includes(`itineraryId=${dataItinerary.id}`)) {
            navigate(`/app?itineraryId=${dataItinerary.id}`, { replace: true });
          }
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
    load();
  }, [location.search, navigate]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <div className="space-y-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
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

  if (hasNoItineraries) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center">
        <PandaLogo size="lg" className="mb-4" />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">¡Aún no tienes viajes!</h1>
          <p className="text-lg text-mutedForeground max-w-md">
            Crea tu primer itinerario personalizado y comienza a planificar tu viaje perfecto.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/app/itineraries">
              <Button size="lg" className="w-full sm:w-auto">
                Crear mi primer itinerario
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => supabase.auth.signOut()} className="w-full sm:w-auto">
              Cerrar sesión
            </Button>
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

