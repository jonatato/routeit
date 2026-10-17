import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createItineraryFromTemplate, fetchItineraryById, saveUserItinerary } from '../services/itinerary';
import { listUserItineraries, type ItinerarySummary } from '../services/sharing';
import { buildTripAlerts } from './alerts';
import { MoneyView } from './components/MoneyView';
import { MoreView } from './components/MoreView';
import { PlanView } from './components/PlanView';
import { TodayView } from './components/TodayView';
import { V2Chrome } from './components/V2Chrome';
import { buildTripFromDraft, parseCityList } from './draftTrip';
import { buildLedger, expensesFromItinerary } from './ledger';
import { activeDestination } from './navigation';
import type { V2Trip } from './sampleTrip';
import { agendaStatus, focusDay } from './today';
import type { TravelItinerary } from '../data/itinerary';

const STORAGE_KEY = 'routeit.v2.tripId';

function LiveApp() {
  const location = useLocation();
  const section = activeDestination(location.pathname);
  const [userId, setUserId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ItinerarySummary[]>([]);
  const [trip, setTrip] = useState<V2Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const now = useMemo(() => new Date(), []);

  const loadTrip = async (id: string, membersName = 'Tú') => {
    const itinerary = await fetchItineraryById(id);
    if (!itinerary) {
      setTrip(null);
      return;
    }
    setTrip({
      itinerary,
      members: [{ id: 'me', name: membersName }],
      documents: [],
      bag: [],
      payments: [],
    });
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      try {
        const list = await listUserItineraries(data.user.id);
        setSummaries(list);
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const selected = list.find(item => item.id === stored)?.id ?? list[0]?.id;
        if (selected) await loadTrip(selected);
        else setTrip(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el viaje.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const createTrip = async (title: string, startDate: string, endDate: string, cities: string) => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createItineraryFromTemplate(userId, buildTripFromDraft({
        title,
        startDate,
        endDate,
        cities: parseCityList(cities),
      }));
      const list = await listUserItineraries(userId);
      setSummaries(list);
      if (created.id) await loadTrip(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el viaje.');
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (itinerary: TravelItinerary) => {
    if (!userId || !trip) return;
    setTrip({ ...trip, itinerary });
    setSaving(true);
    try {
      const saved = await saveUserItinerary(userId, itinerary, itinerary.id);
      setTrip(current => current ? { ...current, itinerary: saved } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  const focus = trip ? focusDay(trip.itinerary, now) : null;
  const agenda = focus ? agendaStatus(focus.day, now) : { current: null, next: null };
  const ledger = trip
    ? buildLedger(trip.members, expensesFromItinerary(trip.itinerary, trip.members[0]?.id ?? 'me'), trip.payments)
    : null;
  const alerts = trip && ledger
    ? buildTripAlerts({ day: focus?.day ?? null, bag: trip.bag, settlementCount: ledger.settlements.length })
    : [];
  const mapHref = agenda.current?.mapLink ?? agenda.next?.mapLink;

  const showPrimary = section === 'today' || section === 'plan' || section === 'money' || (section === 'more' && location.pathname === '/app/more');

  return (
    <V2Chrome
      base="/app"
      title={trip?.itinerary.title ?? 'RouteIt'}
      subtitle={saving ? 'Guardando…' : trip?.itinerary.dateRange}
    >
      {summaries.length > 1 && (
        <label className="mb-6 grid max-w-xl gap-1 text-sm">
          Cambiar de viaje
          <select
            className="rounded-lg border border-border bg-background px-3 py-2"
            value={trip?.itinerary.id ?? ''}
            onChange={event => void loadTrip(event.target.value)}
          >
            {summaries.map(item => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-mutedForeground">Cargando el viaje…</p>}
      {!loading && !trip && section === 'today' && <DraftTripForm busy={saving} onCreate={createTrip} />}
      {!loading && !trip && section !== 'today' && showPrimary && (
        <p className="text-sm text-mutedForeground">Crea el viaje desde Hoy. Hacen falta el nombre, las fechas y las ciudades.</p>
      )}
      {!loading && trip && showPrimary && section === 'today' && (
        <TodayView
          title={focus?.day.city ?? trip.itinerary.title}
          dateLabel={focus?.day.date ?? 'Sin día para esta fecha'}
          plan={focus?.day.plan ?? 'Abre el plan para añadir el día.'}
          agenda={agenda}
          alerts={alerts}
          mapHref={mapHref}
          planHref="/app/plan"
          empty={focus ? undefined : 'Este viaje no tiene un día para hoy.'}
        />
      )}
      {!loading && trip && section === 'plan' && (
        <PlanView itinerary={trip.itinerary} members={trip.members} editable onChange={itinerary => void savePlan(itinerary)} />
      )}
      {!loading && trip && ledger && section === 'money' && <MoneyView ledger={ledger} />}
      {!loading && section === 'more' && location.pathname === '/app/more' && (
        <MoreView
          bag={trip?.bag ?? []}
          documents={trip?.documents ?? []}
          links={[
            { label: 'Mis viajes', to: '/app/itineraries' },
            { label: 'Documentos', to: '/app/documents' },
            { label: 'Maleta', to: '/app/bag' },
            { label: 'Cuenta', to: '/app/profile' },
          ]}
        />
      )}
      {!showPrimary && <Outlet />}
    </V2Chrome>
  );
}

function DraftTripForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (title: string, startDate: string, endDate: string, cities: string) => Promise<void>;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onCreate(
      String(data.get('title') || ''),
      String(data.get('start') || ''),
      String(data.get('end') || ''),
      String(data.get('cities') || ''),
    );
  };

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-xl gap-3">
      <h2 className="text-xl font-semibold">Nuevo viaje</h2>
      <p className="text-sm text-mutedForeground">Nombre, fechas y ciudades. El plan se puede completar después.</p>
      <label className="grid gap-1 text-sm">
        Nombre
        <input name="title" required className="rounded-lg border border-border bg-background px-3 py-2" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Empieza
          <input name="start" type="date" required className="rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Termina
          <input name="end" type="date" required className="rounded-lg border border-border bg-background px-3 py-2" />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Ciudades
        <input name="cities" required placeholder="Oporto, Lisboa" className="rounded-lg border border-border bg-background px-3 py-2" />
      </label>
      <button type="submit" disabled={busy} className="w-fit rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primaryForeground">
        Crear viaje
      </button>
    </form>
  );
}

export default LiveApp;
