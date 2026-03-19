import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MobilePageHeader } from '../components/MobilePageHeader';
import ItineraryDocumentsSection from '../components/ItineraryDocumentsSection';
import { TabPageSkeleton } from '../components/TabPageSkeleton';
import { supabase } from '../lib/supabase';
import { checkUserRole, fetchItineraryById, fetchUserItinerary } from '../services/itinerary';
import type { TravelItinerary } from '../data/itinerary';
import type { CollaboratorRole } from '../services/sharing';

function Documents() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [hasNoItineraries, setHasNoItineraries] = useState(false);
  const [role, setRole] = useState<CollaboratorRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setHasNoItineraries(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('No hay sesión activa.');
        setItinerary(null);
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      try {
        const params = new URLSearchParams(location.search);
        const queryItineraryId = params.get('itineraryId');

        const loadedItinerary = queryItineraryId
          ? await fetchItineraryById(queryItineraryId)
          : await fetchUserItinerary(user.id);

        if (!loadedItinerary) {
          setHasNoItineraries(true);
          setItinerary(null);
          setRole(null);
          return;
        }

        setItinerary(loadedItinerary);

        const resolvedRole = await checkUserRole(user.id, loadedItinerary.id ?? '');
        setRole((resolvedRole as CollaboratorRole | null) ?? 'owner');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar los documentos.';
        setError(message);
        setItinerary(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [location.search]);

  if (isLoading) {
    return <TabPageSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24 md:py-10">
        <MobilePageHeader title="Documentos" subtitle="Error al cargar" backTo="/app" />
        <Card>
          <CardHeader>
            <CardTitle>No se pudieron cargar los documentos</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app">
              <Button variant="outline">Volver al itinerario</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasNoItineraries || !itinerary || !itinerary.id) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24 md:py-10">
        <MobilePageHeader title="Documentos" subtitle="Sin itinerarios" backTo="/app" />
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes itinerarios</CardTitle>
            <CardDescription>Crea un itinerario para empezar a guardar documentos importantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/itineraries">
              <Button>Ir a Mis viajes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24 md:py-10">
      <MobilePageHeader title="Documentos" subtitle={itinerary.title} backTo="/app" />

      <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Volver">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <FileText className="h-7 w-7 text-primary" />
              Documentos
            </h1>
            <p className="text-sm text-mutedForeground">{itinerary.title}</p>
          </div>
        </div>
      </div>

      <ItineraryDocumentsSection itineraryId={itinerary.id} role={role} currentUserId={currentUserId} />
    </div>
  );
}

export default Documents;
