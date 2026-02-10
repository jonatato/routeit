import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchItineraryById, fetchUserItinerary } from '../services/itinerary';
import type { TravelItinerary } from '../data/itinerary';
import { getDayForDate, getItineraryStartDate, getNextDayFromDate, isSameDay } from '../utils/itineraryDates';
import FullscreenLoader from '../components/FullscreenLoader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

function TodayItinerary() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
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
        const queryItineraryId = params.get('itineraryId');
        const dataItinerary = queryItineraryId
          ? await fetchItineraryById(queryItineraryId)
          : await fetchUserItinerary(user.id);
        setItinerary(dataItinerary ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar el itinerario.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [location.search]);

  const today = useMemo(() => new Date(), []);
  const todayDay = useMemo(() => (itinerary ? getDayForDate(itinerary, today) : null), [itinerary, today]);
  const startDate = useMemo(() => (itinerary ? getItineraryStartDate(itinerary) : null), [itinerary]);
  const nextDay = useMemo(() => (itinerary ? getNextDayFromDate(itinerary, today) : null), [itinerary, today]);

  if (isLoading) {
    return <FullscreenLoader message="Cargando dia actual..." />;
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
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-mutedForeground">No hay itinerarios disponibles.</p>
        <Link to="/app/itineraries">
          <Button>Ver mis itinerarios</Button>
        </Link>
      </div>
    );
  }

  const startLabel = startDate ? startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
  const isTripStarted = Boolean(startDate && (isSameDay(startDate, today) || startDate.getTime() < today.getTime()));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">Dia actual</p>
            <h1 className="text-3xl font-bold">{itinerary.title}</h1>
            {startLabel && (
              <div className="flex items-center gap-2 text-sm text-mutedForeground">
                <Calendar className="h-4 w-4" />
                <span>Inicio: {startLabel}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/app${location.search}`}>
              <Button variant="outline">Ver itinerario completo</Button>
            </Link>
          </div>
        </div>

        {todayDay ? (
          <Card className="border-2 border-primary/20">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                <span>{todayDay.day.dayLabel}</span>
                <span>·</span>
                <span>{todayDay.day.date}</span>
              </div>
              <CardTitle className="text-2xl">{todayDay.day.city}</CardTitle>
              <CardDescription>{todayDay.day.plan}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayDay.day.schedule.length > 0 ? (
                <div className="space-y-3">
                  {todayDay.day.schedule.map((item, index) => (
                    <div key={`${item.time}-${index}`} className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{item.time || 'Sin hora'}</span>
                        <span>{item.activity}</span>
                      </div>
                      {(item.link || item.mapLink) && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {item.link && (
                            <a
                              className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-primary"
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Entradas
                            </a>
                          )}
                          {item.mapLink && (
                            <a
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700"
                              href={item.mapLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Maps
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-mutedForeground">
                  No hay actividades configuradas para hoy.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Hoy no hay dia asignado</CardTitle>
              <CardDescription>
                {isTripStarted
                  ? 'No encontramos actividades con fecha de hoy.'
                  : 'El itinerario aun no ha comenzado.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-mutedForeground">
              {nextDay && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Proximo dia: {nextDay.day.dayLabel} · {nextDay.day.city} · {nextDay.day.date}
                  </span>
                </div>
              )}
              <Link to={`/app${location.search}`}>
                <Button variant="outline">Ver itinerario completo</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TodayItinerary;
