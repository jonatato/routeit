import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Pencil } from 'lucide-react';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MobilePageHeader } from '../components/MobilePageHeader';
import { driver } from 'driver.js';
import RichTextEditor from '../components/RichTextEditor';
import { ActivityEditModal } from '../components/ActivityEditModal';
import { ActivityAdminMetaModal } from '../components/ActivityAdminMetaModal';
import { DaySelectorCarousel } from '../components/DaySelectorCarousel';
import type { ItineraryDay, TravelItinerary, Flight, FlightSegment } from '../data/itinerary';
import { supabase } from '../lib/supabase';
import { resolveMapsUrl } from '../services/maps';
import { fetchItineraryById, fetchUserItinerary, saveUserItinerary, checkUserRole } from '../services/itinerary';
import {
  createItineraryDocument,
  listItineraryDocuments,
  type CreateItineraryDocumentInput,
  type ItineraryDocument,
} from '../services/documents';
import { ensureSplitGroup, fetchSplit, type SplitMember } from '../services/split';
import { useToast } from '../hooks/useToast';
import FullscreenLoader from '../components/FullscreenLoader';

const listSections = [
  { key: 'foods', label: 'Comidas típicas' },
  { key: 'tips', label: 'Consejos' },
  { key: 'avoid', label: 'Cosas a evitar' },
  { key: 'utilities', label: 'Utilidades' },
  { key: 'packing', label: 'Checklist de maleta' },
  { key: 'money', label: 'Dinero y pagos' },
  { key: 'connectivity', label: 'Conectividad' },
  { key: 'transport', label: 'Transporte' },
  { key: 'safety', label: 'Seguridad' },
  { key: 'etiquette', label: 'Etiqueta local' },
  { key: 'weather', label: 'Clima' },
  { key: 'scams', label: 'Estafas comunes' },
  { key: 'budgetTips', label: 'Presupuesto inteligente' },
  { key: 'emergency', label: 'Emergencias' },
] as const;

const SHOW_COVER_IMAGE_FIELD = false;

const createTempId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
};

const createEmptySegment = (): FlightSegment => ({
  id: createTempId(),
  departureAirport: '',
  departureCity: '',
  departureTime: '',
  arrivalAirport: '',
  arrivalCity: '',
  arrivalTime: '',
  duration: '',
});

const createEmptyFlight = (direction: Flight['direction'] = 'outbound'): Flight => ({
  id: createTempId(),
  direction,
  date: '',
  status: 'confirmed',
  segments: [createEmptySegment()],
});

const normalizeFlightsList = (itinerary: TravelItinerary): Flight[] => {
  if (itinerary.flightsList && itinerary.flightsList.length > 0) return itinerary.flightsList;
  const outbound = itinerary.flights?.outbound;
  const inbound = itinerary.flights?.inbound;
  const legacyFlights: Flight[] = [];
  if (outbound) {
    legacyFlights.push({
      id: createTempId(),
      direction: 'outbound',
      date: outbound.date,
      totalDuration: outbound.duration,
      stops: outbound.stops === 'Directo' ? 0 : 1,
      segments: [
        {
          id: createTempId(),
          departureAirport: outbound.fromCity,
          departureCity: outbound.fromCity,
          departureTime: outbound.fromTime,
          arrivalAirport: outbound.toCity,
          arrivalCity: outbound.toCity,
          arrivalTime: outbound.toTime,
          duration: outbound.duration,
        },
      ],
    });
  }
  if (inbound) {
    legacyFlights.push({
      id: createTempId(),
      direction: 'inbound',
      date: inbound.date,
      totalDuration: inbound.duration,
      stops: inbound.stops === 'Directo' ? 0 : 1,
      segments: [
        {
          id: createTempId(),
          departureAirport: inbound.fromCity,
          departureCity: inbound.fromCity,
          departureTime: inbound.fromTime,
          arrivalAirport: inbound.toCity,
          arrivalCity: inbound.toCity,
          arrivalTime: inbound.toTime,
          duration: inbound.duration,
        },
      ],
    });
  }
  return legacyFlights.length > 0 ? legacyFlights : [createEmptyFlight()];
};

const splitLines = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

const deriveRouteFromLocations = (locations: TravelItinerary['locations']) => {
  const seen = new Set<string>();

  return locations.flatMap(location => {
    const city = location.city.trim();
    const hasCoords =
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng) &&
      !(location.lat === 0 && location.lng === 0);

    if (!city || !hasCoords) return [];

    const normalizedCity = city.toLowerCase();
    if (seen.has(normalizedCity)) return [];

    seen.add(normalizedCity);
    return [city];
  });
};

const syncRouteWithLocations = (itinerary: TravelItinerary): TravelItinerary => {
  const derivedRoute = deriveRouteFromLocations(itinerary.locations);
  const hasSameRoute =
    derivedRoute.length === itinerary.route.length &&
    derivedRoute.every((city, index) => city === itinerary.route[index]);

  if (hasSameRoute) return itinerary;

  return {
    ...itinerary,
    route: derivedRoute,
  };
};

const toNumber = (value: string) => (Number.isNaN(Number(value)) ? 0 : Number(value));

const parseGoogleMapsCoords = (input: string) => {
  const value = input.trim();
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /center=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
};

const isGoogleMapsUrl = (input: string) => {
  const value = input.toLowerCase();
  return (
    value.includes('google.com/maps') ||
    value.includes('maps.app.goo.gl') ||
    value.includes('goo.gl/maps') ||
    value.includes('maps.google')
  );
};

const buildListHtml = (items: string[]) => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
};

type OnboardingSection =
  | 'general'
  | 'flights'
  | 'budget'
  | 'lists'
  | 'phrases'
  | 'map'
  | 'days'
  | 'tags';

type OnboardingStep = {
  element: string | (() => Element);
  section?: OnboardingSection;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
};

const findVisibleElement = (selectors: string[]) => {
  if (typeof document === 'undefined') return {} as Element;
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element && element.offsetParent !== null) {
      return element;
    }
  }
  return document.body;
};

const onboardingSteps: OnboardingStep[] = [
  {
    element: '[data-onboarding="admin-tabs"]',
    section: 'general',
    popover: {
      title: 'Paneles del itinerario',
      description: 'Te guiaremos panel por panel. Empieza por General y luego pasamos a Dias y Mapa.',
      side: 'bottom',
    },
  },
  {
    element: '[data-onboarding="general-title"]',
    section: 'general',
    popover: {
      title: 'Titulo del viaje',
      description: 'Escribe un nombre claro. Ejemplo: "Japon 2026" o "Roma en 5 dias".',
      side: 'right',
    },
  },
  {
    element: '[data-onboarding="general-daterange"]',
    section: 'general',
    popover: {
      title: 'Rango de fechas',
      description: 'Usa un formato simple. Ejemplo: "15-30 Marzo 2026".',
      side: 'right',
    },
  },
  {
    element: '[data-onboarding="days-section"]',
    section: 'days',
    popover: {
      title: 'Dias y actividades',
      description: 'Aqui defines el plan diario. Selecciona un dia y anade horarios con actividades.',
      side: 'top',
    },
  },
  {
    element: '[data-onboarding="days-add-schedule"]',
    section: 'days',
    popover: {
      title: 'Anade un horario',
      description: 'Ejemplo: "09:00-11:30" y "Museo del Prado". Puedes pegar un link de Maps.',
      side: 'right',
    },
  },
  {
    element: '[data-onboarding="map-route"]',
    section: 'map',
    popover: {
      title: 'Ruta y ciudades',
      description: 'Ordena aqui las ciudades con coordenadas. La ruta del mapa se genera automaticamente con esa lista.',
      side: 'top',
    },
  },
  {
    element: () => findVisibleElement([
      '[data-onboarding="save-itinerary"]',
      '[data-onboarding="save-itinerary-mobile"]',
    ]),
    popover: {
      title: 'Guardar cambios',
      description: 'Cuando termines, guarda y revisa el itinerario publicado.',
      side: 'left',
    },
  },
];

const formatDateRangeFromIso = (startDate?: string, endDate?: string) => {
  const format = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  if (startDate && endDate) return `${format(startDate)} - ${format(endDate)}`;
  if (startDate) return format(startDate);
  if (endDate) return format(endDate);
  return '';
};

const applyCoordInput = (
  value: string,
  current: { lat?: number; lng?: number },
  field: 'lat' | 'lng',
) => {
  const coords = parseGoogleMapsCoords(value);
  if (coords) {
    return { lat: coords.lat, lng: coords.lng };
  }
  if (value === '') {
    return { ...current, [field]: undefined };
  }
  return { ...current, [field]: toNumber(value) };
};

function AdminItinerary() {
  const [draft, setDraft] = useState<TravelItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [splitMembers, setSplitMembers] = useState<SplitMember[]>([]);
  const [activeSection, setActiveSection] = useState<
    'general' | 'flights' | 'budget' | 'lists' | 'phrases' | 'map' | 'days' | 'tags'
  >('general');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [editingActivityMeta, setEditingActivityMeta] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [itineraryDocuments, setItineraryDocuments] = useState<ItineraryDocument[]>([]);
  const [mapCoordInputs, setMapCoordInputs] = useState<Record<number, string>>({});
  const [mapResolveStatus, setMapResolveStatus] = useState<Record<string, boolean>>({});
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const activeSectionRef = useRef(activeSection);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const startOnboarding = useCallback((source: 'auto' | 'manual') => {
    if (driverRef.current?.isActive()) return;

    setActiveSection('general');

    const driverObj = driver({
      showProgress: true,
      overlayOpacity: 0.55,
      overlayColor: 'rgb(15, 23, 42)',
      smoothScroll: true,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'routeit-onboarding',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atras',
      doneBtnText: 'Listo',
      onNextClick: () => {
        const nextIndex = driverObj.getActiveIndex() + 1;
        if (nextIndex >= onboardingSteps.length) {
          driverObj.destroy();
          return;
        }
        const nextSection = onboardingSteps[nextIndex]?.section;
        if (nextSection && nextSection !== activeSectionRef.current) {
          setActiveSection(nextSection);
          setTimeout(() => driverObj.moveTo(nextIndex), 250);
          return;
        }
        driverObj.moveNext();
      },
      onPrevClick: () => {
        const prevIndex = driverObj.getActiveIndex() - 1;
        if (prevIndex < 0) {
          driverObj.moveTo(0);
          return;
        }
        const prevSection = onboardingSteps[prevIndex]?.section;
        if (prevSection && prevSection !== activeSectionRef.current) {
          setActiveSection(prevSection);
          setTimeout(() => driverObj.moveTo(prevIndex), 250);
          return;
        }
        driverObj.movePrevious();
      },
      onCloseClick: () => {
        driverObj.destroy();
      },
    });

    driverRef.current = driverObj;
    setHasStartedOnboarding(true);

    driverObj.setSteps(onboardingSteps.map(step => ({
      element: step.element,
      popover: step.popover,
    })));

    setTimeout(() => {
      driverObj.drive(0);
    }, source === 'manual' ? 150 : 250);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatus(null);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setStatus('No hay sesión activa.');
        setIsLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams(location.search);
        const itineraryId = params.get('itineraryId');
        const dataItinerary = itineraryId ? await fetchItineraryById(itineraryId) : await fetchUserItinerary(user.id);
        if (!dataItinerary) {
          // Si no hay itinerario, redirigir a crear uno nuevo
          setStatus('No se encontró ningún itinerario. Por favor, crea uno nuevo.');
          return;
        }
        
        // Verificar permisos del usuario
        const role = await checkUserRole(user.id, dataItinerary.id || '');
        setUserRole(role);
        
        // Si es viewer, redirigir a la vista del itinerario
        if (role === 'viewer') {
          toast.error('No tienes permisos para editar este itinerario');
          navigate(`/app?itineraryId=${dataItinerary.id}`);
          return;
        }
        
        setDraft(syncRouteWithLocations(dataItinerary));
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'No se pudo cargar el itinerario.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [location.search, navigate, toast]);

  useEffect(() => {
    if (!draft?.id) return;
    const loadSplitMembers = async () => {
      try {
        const group = await ensureSplitGroup(draft.id!);
        const { members } = await fetchSplit(group.id);
        setSplitMembers(members);
      } catch (err) {
        console.error('Error cargando miembros de Split:', err);
      }
    };
    loadSplitMembers();
  }, [draft?.id]);

  useEffect(() => {
    if (!draft?.id) {
      setItineraryDocuments([]);
      return;
    }

    const loadDocuments = async () => {
      try {
        const documents = await listItineraryDocuments(draft.id!);
        setItineraryDocuments(documents);
      } catch (error) {
        console.error('Error cargando documentos del itinerario:', error);
      }
    };

    void loadDocuments();
  }, [draft?.id]);

  useEffect(() => {
    if (!draft) return;
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    const dayIdParam = params.get('dayId');
    if (sectionParam === 'days') {
      setActiveSection('days');
    }
    if (dayIdParam) {
      const index = draft.days.findIndex(day => day.id === dayIdParam);
      if (index >= 0) {
        setActiveDayIndex(index);
      }
    }
  }, [draft, location.search]);

  useEffect(() => {
    if (!draft || hasStartedOnboarding) return;
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') !== '1') return;
    startOnboarding('auto');
    params.delete('onboarding');
    const search = params.toString();
    navigate({ search: search ? `?${search}` : '' }, { replace: true });
  }, [draft, hasStartedOnboarding, location.search, navigate, startOnboarding]);

  useEffect(() => {
    if (!draft) return;
    if (draft.flightsList && draft.flightsList.length > 0) return;
    updateDraft({ flightsList: normalizeFlightsList(draft) });
  }, [draft]);

  const updateDraft = (patch: Partial<TravelItinerary>) => {
    setDraft(prev => (prev ? syncRouteWithLocations({ ...prev, ...patch }) : prev));
  };

  const updateDay = (index: number, patch: Partial<ItineraryDay>) => {
    setDraft(prev => {
      if (!prev) return prev;
      const days = [...prev.days];
      days[index] = { ...days[index], ...patch };
      return { ...prev, days };
    });
  };

  const updateScheduleItem = useCallback((dayIndex: number, scheduleIndex: number, patch: Partial<ItineraryDay['schedule'][number]>) => {
    setDraft(prev => {
      if (!prev) return prev;
      const days = [...prev.days];
      const schedule = [...days[dayIndex].schedule];
      schedule[scheduleIndex] = {
        ...schedule[scheduleIndex],
        ...patch,
      };
      days[dayIndex] = {
        ...days[dayIndex],
        schedule,
      };
      return { ...prev, days };
    });
  }, []);

  const handleCreateActivityDocument = useCallback(async (input: CreateItineraryDocumentInput) => {
    const createdDocument = await createItineraryDocument(input);
    setItineraryDocuments(prev => [createdDocument, ...prev]);
    return createdDocument;
  }, []);

  const handleLocationMapInput = (index: number, raw: string) => {
    if (!draft) return;
    setMapCoordInputs(prev => ({ ...prev, [index]: raw }));
    const coords = parseGoogleMapsCoords(raw);
    const next = [...draft.locations];
    next[index] = {
      ...next[index],
      lat: coords?.lat ?? next[index].lat,
      lng: coords?.lng ?? next[index].lng,
    };
    updateDraft({ locations: next });
    if (isGoogleMapsUrl(raw)) {
      const resolveKey = `map-${index}`;
      setMapResolveStatus(prev => ({ ...prev, [resolveKey]: true }));
      void resolveMapsUrl(raw)
        .then(resolved => {
          if (!resolved) return;
          const refreshed = [...next];
          refreshed[index] = {
            ...refreshed[index],
            lat: resolved.lat ?? refreshed[index].lat,
            lng: resolved.lng ?? refreshed[index].lng,
          };
          updateDraft({ locations: refreshed });
          if (resolved.lat !== undefined && resolved.lng !== undefined) {
            setMapCoordInputs(prev => ({
              ...prev,
              [index]: `${resolved.lat}, ${resolved.lng}`,
            }));
          }
        })
        .finally(() => {
          setMapResolveStatus(prev => ({ ...prev, [resolveKey]: false }));
        });
    }
  };

  const flightsList = draft?.flightsList ?? [];

  const updateFlightsList = (next: Flight[]) => {
    updateDraft({ flightsList: next });
  };

  const updateFlight = (index: number, patch: Partial<Flight>) => {
    const next = [...flightsList];
    next[index] = { ...next[index], ...patch };
    updateFlightsList(next);
  };

  const updateSegment = (flightIndex: number, segmentIndex: number, patch: Partial<FlightSegment>) => {
    const next = [...flightsList];
    const flight = next[flightIndex];
    if (!flight) return;
    const segments = [...flight.segments];
    segments[segmentIndex] = { ...segments[segmentIndex], ...patch };
    next[flightIndex] = { ...flight, segments };
    updateFlightsList(next);
  };

  const addFlight = () => {
    updateFlightsList([...flightsList, createEmptyFlight('outbound')]);
  };

  const removeFlight = (index: number) => {
    updateFlightsList(flightsList.filter((_, i) => i !== index));
  };

  const moveFlight = (from: number, to: number) => {
    if (to < 0 || to >= flightsList.length) return;
    const next = [...flightsList];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateFlightsList(next);
  };

  const addSegment = (flightIndex: number) => {
    const next = [...flightsList];
    const flight = next[flightIndex];
    if (!flight) return;
    next[flightIndex] = { ...flight, segments: [...flight.segments, createEmptySegment()] };
    updateFlightsList(next);
  };

  const removeSegment = (flightIndex: number, segmentIndex: number) => {
    const next = [...flightsList];
    const flight = next[flightIndex];
    if (!flight) return;
    const segments = flight.segments.filter((_, i) => i !== segmentIndex);
    next[flightIndex] = { ...flight, segments: segments.length > 0 ? segments : [createEmptySegment()] };
    updateFlightsList(next);
  };

  const moveSegment = (flightIndex: number, from: number, to: number) => {
    const next = [...flightsList];
    const flight = next[flightIndex];
    if (!flight || to < 0 || to >= flight.segments.length) return;
    const segments = [...flight.segments];
    const [item] = segments.splice(from, 1);
    segments.splice(to, 0, item);
    next[flightIndex] = { ...flight, segments };
    updateFlightsList(next);
  };

  type ListSectionKey = (typeof listSections)[number]['key'];

  const updateListSection = (key: ListSectionKey, items: string[]) => {
    updateDraft({ [key]: items } as Partial<TravelItinerary>);
  };

  const activeDay = draft ? draft.days[activeDayIndex] : null;
  const documentsById = useMemo(
    () => new Map(itineraryDocuments.map(document => [document.id, document] as const)),
    [itineraryDocuments],
  );

  const moveItem = <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    return next;
  };

  const isResolvingMaps = Object.values(mapResolveStatus).some(Boolean);

  const persistDraft = useCallback(async (nextDraft: TravelItinerary, successMessage = 'Cambios guardados correctamente') => {
    if (userRole === 'viewer') {
      toast.error('No tienes permisos para guardar cambios');
      return false;
    }

    setIsSaving(true);
    setStatus(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setStatus('No hay sesión activa.');
      toast.error('No hay sesión activa.');
      setIsSaving(false);
      return false;
    }

    try {
      const normalizedDraft = syncRouteWithLocations(nextDraft);
      const saved = await saveUserItinerary(user.id, normalizedDraft, normalizedDraft.id);
      setDraft(syncRouteWithLocations(saved));
      setStatus('Cambios guardados.');
      toast.success(successMessage);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo guardar.';
      setStatus(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, userRole]);

  const handleSave = async () => {
    if (!draft) return;
    await persistDraft(draft);
  };

  if (isLoading) {
    return <FullscreenLoader message="Cargando itinerario..." />;
  }

  if (!draft) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">{status ?? 'No se pudo cargar el panel.'}</p>
        <Button className="mt-4" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isSaving && <FullscreenLoader message="Guardando cambios del itinerario..." />}

      {/* Header Mobile */}
      <MobilePageHeader
        title="Administrar itinerario"
        subtitle="Edición rápida del viaje"
        backTo="/app"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => startOnboarding('manual')} className="w-full">
              Tutorial
            </Button>
            <Button
              data-onboarding="save-itinerary-mobile"
              onClick={handleSave}
              disabled={isSaving || isResolvingMaps}
              size="sm"
              className="w-full"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      />

      {/* Content */}
      <div className="mx-auto w-full px-4 py-6">
        {isResolvingMaps && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Resolviendo enlace de Maps...
            </div>
          </div>
        )}

        {/* Desktop Header */}
        <div className="mb-6 hidden items-center justify-between md:flex">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Administrar Itinerario
            </h1>
            <p className="text-muted-foreground">Edita tu itinerario dinámico</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app">
              <Button variant="outline">Ver itinerario</Button>
            </Link>
            <Button variant="outline" onClick={() => startOnboarding('manual')}>
              Iniciar tutorial
            </Button>
            <Button data-onboarding="save-itinerary" onClick={handleSave} disabled={isSaving || isResolvingMaps}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div
          className="flex gap-0.5 overflow-x-auto no-scrollbar bg-muted/30 p-1 rounded-t-lg"
          data-onboarding="admin-tabs"
        >
          <button
            onClick={() => setActiveSection('general')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'general'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSection('days')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'days'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Días
          </button>
          <button
            onClick={() => setActiveSection('flights')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'flights'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Vuelos
          </button>
          <button
            onClick={() => setActiveSection('budget')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'budget'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Presupuesto
          </button>
          <button
            onClick={() => setActiveSection('lists')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'lists'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Listas
          </button>
          <button
            onClick={() => setActiveSection('map')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'map'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Mapa
          </button>
          <button
            onClick={() => setActiveSection('phrases')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'phrases'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Frases
          </button>
          <button
            onClick={() => setActiveSection('tags')}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all ${
              activeSection === 'tags'
                ? 'bg-background text-primary border-t border-x border-border shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            Etiquetas
          </button>
          <Link to="/app/admin/sections">
            <button
              className="px-4 py-2.5 text-sm font-medium shrink-0 rounded-t-lg transition-all bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              Secciones
            </button>
          </Link>
        </div>
      {status && <p className="text-sm text-mutedForeground mb-6">{status}</p>}

      {/* Content Sections */}
      <div className="space-y-6 -mt-px">
          {activeSection === 'general' && (
            <Card className="shadow-md">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle>Información general</CardTitle>
          <CardDescription>Título, rango de fechas y descripción.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <input
              data-onboarding="general-title"
              value={draft.title}
              onChange={event => updateDraft({ title: event.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha inicio</label>
            <input
              data-onboarding="general-daterange"
              type="date"
              value={draft.startDate ?? ''}
              onChange={event => {
                const startDate = event.target.value;
                updateDraft({
                  startDate,
                  dateRange: formatDateRangeFromIso(startDate, draft.endDate),
                });
              }}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha fin</label>
            <input
              type="date"
              min={draft.startDate}
              value={draft.endDate ?? ''}
              onChange={event => {
                const endDate = event.target.value;
                updateDraft({
                  endDate,
                  dateRange: formatDateRangeFromIso(draft.startDate, endDate),
                });
              }}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            />
          </div>
          {SHOW_COVER_IMAGE_FIELD && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de portada</label>
              <CloudinaryUpload 
                onUpload={(url) => updateDraft({ coverImage: url })}
                currentImage={draft.coverImage}
              />
            </div>
          )}
        <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium">Introducción</label>
            <RichTextEditor value={draft.intro} onChange={value => updateDraft({ intro: value })} />
          </div>
        </CardContent>
      </Card>
          )}

          {activeSection === 'flights' && (
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Vuelos</CardTitle>
                    <CardDescription>Gestiona vuelos con múltiples segmentos.</CardDescription>
                  </div>
                  <Button size="sm" onClick={addFlight}>Añadir vuelo</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {flightsList.map((flight, flightIndex) => (
                  <div key={flight.id} className="rounded-xl border border-border bg-background p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={flight.direction}
                          onChange={event => updateFlight(flightIndex, { direction: event.target.value as Flight['direction'] })}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="outbound">Ida</option>
                          <option value="inbound">Vuelta</option>
                          <option value="oneway">Solo ida</option>
                          <option value="multi">Multi-ciudad</option>
                        </select>
                        <input
                          placeholder="Etiqueta (opcional)"
                          value={flight.label ?? ''}
                          onChange={event => updateFlight(flightIndex, { label: event.target.value })}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[200px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveFlight(flightIndex, flightIndex - 1)} disabled={flightIndex === 0}>↑</Button>
                        <Button variant="outline" size="sm" onClick={() => moveFlight(flightIndex, flightIndex + 1)} disabled={flightIndex === flightsList.length - 1}>↓</Button>
                        <Button variant="outline" size="sm" onClick={() => removeFlight(flightIndex)} disabled={flightsList.length === 1}>Eliminar</Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Fecha</label>
                        <input
                          value={flight.date}
                          onChange={event => updateFlight(flightIndex, { date: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Referencia</label>
                        <input
                          value={flight.bookingReference ?? ''}
                          onChange={event => updateFlight(flightIndex, { bookingReference: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Asiento</label>
                        <input
                          value={flight.seat ?? ''}
                          onChange={event => updateFlight(flightIndex, { seat: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Clase</label>
                        <select
                          value={flight.cabinClass ?? ''}
                          onChange={event => updateFlight(flightIndex, { cabinClass: event.target.value as Flight['cabinClass'] })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Sin definir</option>
                          <option value="economy">Economy</option>
                          <option value="premium_economy">Premium Economy</option>
                          <option value="business">Business</option>
                          <option value="first">First Class</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Estado</label>
                        <select
                          value={flight.status ?? 'confirmed'}
                          onChange={event => updateFlight(flightIndex, { status: event.target.value as Flight['status'] })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="confirmed">Confirmado</option>
                          <option value="pending">Pendiente</option>
                          <option value="delayed">Retrasado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-mutedForeground">Duración total</label>
                        <input
                          value={flight.totalDuration ?? ''}
                          onChange={event => updateFlight(flightIndex, { totalDuration: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Segmentos</p>
                      <Button variant="outline" size="sm" onClick={() => addSegment(flightIndex)}>Añadir segmento</Button>
                    </div>

                    <div className="space-y-4">
                      {flight.segments.map((segment, segmentIndex) => (
                        <div key={segment.id} className="rounded-lg border border-border bg-muted/20 p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <p className="text-xs font-semibold text-mutedForeground">Segmento {segmentIndex + 1}</p>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => moveSegment(flightIndex, segmentIndex, segmentIndex - 1)} disabled={segmentIndex === 0}>↑</Button>
                              <Button variant="outline" size="sm" onClick={() => moveSegment(flightIndex, segmentIndex, segmentIndex + 1)} disabled={segmentIndex === flight.segments.length - 1}>↓</Button>
                              <Button variant="outline" size="sm" onClick={() => removeSegment(flightIndex, segmentIndex)} disabled={flight.segments.length === 1}>Eliminar</Button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Aerolínea</label>
                              <input
                                value={segment.airline ?? ''}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { airline: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Código aerolínea</label>
                              <input
                                value={segment.airlineCode ?? ''}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { airlineCode: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Número de vuelo</label>
                              <input
                                value={segment.flightNumber ?? ''}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { flightNumber: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Aeropuerto salida</label>
                              <input
                                value={segment.departureAirport}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { departureAirport: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Ciudad salida</label>
                              <input
                                value={segment.departureCity}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { departureCity: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Hora salida</label>
                              <input
                                value={segment.departureTime}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { departureTime: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Terminal salida</label>
                              <input
                                value={segment.departureTerminal ?? ''}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { departureTerminal: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Aeropuerto llegada</label>
                              <input
                                value={segment.arrivalAirport}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { arrivalAirport: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Ciudad llegada</label>
                              <input
                                value={segment.arrivalCity}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { arrivalCity: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Hora llegada</label>
                              <input
                                value={segment.arrivalTime}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { arrivalTime: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Terminal llegada</label>
                              <input
                                value={segment.arrivalTerminal ?? ''}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { arrivalTerminal: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-mutedForeground">Duración</label>
                              <input
                                value={segment.duration}
                                onChange={event => updateSegment(flightIndex, segmentIndex, { duration: event.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'budget' && (
            <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Presupuesto</CardTitle>
          <CardDescription>Configura los tiers diarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.budgetTiers.map((tier, index) => (
            <div key={`${tier.label}-${index}`} className="grid gap-2 md:grid-cols-4">
              <input
                value={tier.label}
                onChange={event => {
                  const next = [...draft.budgetTiers];
                  next[index] = { ...tier, label: event.target.value };
                  updateDraft({ budgetTiers: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={String(tier.daily)}
                onChange={event => {
                  const next = [...draft.budgetTiers];
                  next[index] = { ...tier, daily: toNumber(event.target.value) };
                  updateDraft({ budgetTiers: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={tier.tone}
                onChange={event => {
                  const next = [...draft.budgetTiers];
                  next[index] = { ...tier, tone: event.target.value as TravelItinerary['budgetTiers'][number]['tone'] };
                  updateDraft({ budgetTiers: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="secondary">Secondary</option>
                <option value="primary">Primary</option>
                <option value="accent">Accent</option>
              </select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateDraft({
                      budgetTiers: moveItem(draft.budgetTiers, index, Math.max(0, index - 1)),
                    })
                  }
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateDraft({
                      budgetTiers: moveItem(
                        draft.budgetTiers,
                        index,
                        Math.min(draft.budgetTiers.length - 1, index + 1),
                      ),
                    })
                  }
                  disabled={index === draft.budgetTiers.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    updateDraft({
                      budgetTiers: draft.budgetTiers.filter((_, i) => i !== index),
                    })
                  }
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              updateDraft({
                budgetTiers: [
                  ...draft.budgetTiers,
                  { label: '', daily: 0, tone: 'secondary' },
                ],
              })
            }
          >
            Añadir tier
          </Button>
        </CardContent>
      </Card>
          )}

          {activeSection === 'lists' && (
            <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Listas principales</CardTitle>
          <CardDescription>Un elemento por línea.</CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
          {listSections.map(section => {
            const items = ((draft as unknown as Record<string, string[]>)[section.key] ?? []).slice();
            return (
              <div key={section.key} className="space-y-3">
                <label className="text-sm font-medium">{section.label}</label>
                <RichTextEditor
                  value={buildListHtml(items)}
                  onChange={value => updateListSection(section.key, value.trim() ? [value] : [])}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
          )}

          {activeSection === 'phrases' && (
            <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Frases útiles</CardTitle>
          <CardDescription>Editar, añadir o eliminar frases.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.phrases.map((phrase, index) => (
            <div key={`${phrase.spanish}-${index}`} className="grid gap-2 md:grid-cols-4">
              <input
                value={phrase.spanish}
                onChange={event => {
                  const next = [...draft.phrases];
                  next[index] = { ...phrase, spanish: event.target.value };
                  updateDraft({ phrases: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={phrase.pinyin}
                onChange={event => {
                  const next = [...draft.phrases];
                  next[index] = { ...phrase, pinyin: event.target.value };
                  updateDraft({ phrases: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={phrase.chinese}
                onChange={event => {
                  const next = [...draft.phrases];
                  next[index] = { ...phrase, chinese: event.target.value };
                  updateDraft({ phrases: next });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateDraft({ phrases: moveItem(draft.phrases, index, Math.max(0, index - 1)) })}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateDraft({ phrases: moveItem(draft.phrases, index, Math.min(draft.phrases.length - 1, index + 1)) })
                  }
                  disabled={index === draft.phrases.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateDraft({ phrases: draft.phrases.filter((_, i) => i !== index) })}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              updateDraft({
                phrases: [...draft.phrases, { spanish: '', pinyin: '', chinese: '' }],
              })
            }
          >
            Añadir frase
          </Button>
        </CardContent>
      </Card>
          )}

          {activeSection === 'map' && (
            <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mapa</CardTitle>
            <CardDescription>Ciudades con coordenadas. La ruta se genera sola en este mismo orden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-mutedForeground" data-onboarding="map-route">
              La ruta del itinerario se autogenera con las ciudades que tengan coordenadas, siguiendo el orden de esta lista.
            </div>
            <div className="space-y-3">
            <h3 className="text-sm font-semibold">Ciudades con coordenadas</h3>
            {draft.locations.map((location, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-5">
                <input
                  value={location.city}
                  onChange={event => {
                    const next = [...draft.locations];
                    next[index] = { ...location, city: event.target.value };
                    updateDraft({ locations: next });
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={location.label}
                  onChange={event => {
                    const next = [...draft.locations];
                    next[index] = { ...location, label: event.target.value };
                    updateDraft({ locations: next });
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="relative">
                  <input
                    value={
                      mapCoordInputs[index] ??
                      (location.lat !== undefined && location.lng !== undefined
                        ? `${location.lat}, ${location.lng}`
                        : '')
                    }
                    onChange={event => handleLocationMapInput(index, event.target.value)}
                    placeholder="Pegar link o 'lat,lng' de Google Maps"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-16 text-sm"
                  />
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      type="button"
                      title="Pegar"
                      onClick={async () => {
                        const text = await navigator.clipboard.readText();
                        if (text) handleLocationMapInput(index, text);
                      }}
                      className="rounded border border-border bg-background p-1 text-muted-foreground hover:text-primary hover:border-primary/50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                        <rect x="4" y="2" width="10" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Borrar"
                      onClick={() => {
                        setMapCoordInputs(prev => ({ ...prev, [index]: '' }));
                        const next = [...draft.locations];
                        next[index] = { ...next[index], lat: 0, lng: 0 };
                        updateDraft({ locations: next });
                      }}
                      className="rounded border border-border bg-background p-1 text-muted-foreground hover:text-primary hover:border-primary/50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
                {mapResolveStatus[`map-${index}`] && (
                  <p className="md:col-span-5 text-xs text-mutedForeground">Resolviendo enlace de Maps...</p>
                )}
                <input
                  value={String(location.lat)}
                  onChange={event => {
                    const value = event.target.value;
                    const coords = applyCoordInput(value, location, 'lat');
                    const next = [...draft.locations];
                    next[index] = {
                      ...location,
                      lat: coords.lat ?? location.lat ?? 0,
                      lng: coords.lng ?? location.lng ?? 0,
                    };
                    updateDraft({ locations: next });
                  }}
                  className="hidden rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={String(location.lng)}
                  onChange={event => {
                    const value = event.target.value;
                    const coords = applyCoordInput(value, location, 'lng');
                    const next = [...draft.locations];
                    next[index] = {
                      ...location,
                      lat: coords.lat ?? location.lat ?? 0,
                      lng: coords.lng ?? location.lng ?? 0,
                    };
                    updateDraft({ locations: next });
                  }}
                  className="hidden rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDraft({ locations: moveItem(draft.locations, index, Math.max(0, index - 1)) })}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDraft({
                        locations: moveItem(draft.locations, index, Math.min(draft.locations.length - 1, index + 1)),
                      })
                    }
                    disabled={index === draft.locations.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateDraft({ locations: draft.locations.filter((_, i) => i !== index) })}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                updateDraft({
                  locations: [
                    ...draft.locations,
                    { city: '', label: '', lat: 0, lng: 0 },
                  ],
                })
              }
            >
              Añadir ciudad
            </Button>
          </div>
        </CardContent>
      </Card>
          )}

          {activeSection === 'tags' && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
                <CardDescription>Crea etiquetas para actividades y días.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(draft.tagsCatalog ?? []).map((tag, index) => (
                  <div key={`${tag.slug}-${index}`} className="grid gap-2 md:grid-cols-5 items-center">
                    <input
                      value={tag.name}
                      onChange={event => {
                        const next = [...(draft.tagsCatalog ?? [])];
                        next[index] = { ...tag, name: event.target.value };
                        updateDraft({ tagsCatalog: next });
                      }}
                      placeholder="Nombre"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      value={tag.slug}
                      onChange={event => {
                        const next = [...(draft.tagsCatalog ?? [])];
                        next[index] = { ...tag, slug: event.target.value };
                        updateDraft({ tagsCatalog: next });
                      }}
                      placeholder="Slug"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tag.color ?? '#6366f1'}
                        onChange={event => {
                          const next = [...(draft.tagsCatalog ?? [])];
                          next[index] = { ...tag, color: event.target.value };
                          updateDraft({ tagsCatalog: next });
                        }}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-1"
                        title="Color de la etiqueta"
                      />
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color ?? '#6366f1' }}
                      >
                        {tag.name || 'Preview'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [...(draft.tagsCatalog ?? [])];
                          const moved = next.splice(index, 1);
                          next.splice(Math.max(0, index - 1), 0, ...moved);
                          updateDraft({ tagsCatalog: next });
                        }}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [...(draft.tagsCatalog ?? [])];
                          const moved = next.splice(index, 1);
                          next.splice(Math.min(next.length, index + 1), 0, ...moved);
                          updateDraft({ tagsCatalog: next });
                        }}
                        disabled={index === (draft.tagsCatalog ?? []).length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          updateDraft({
                            tagsCatalog: (draft.tagsCatalog ?? []).filter((_, i) => i !== index),
                          })
                        }
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    updateDraft({
                      tagsCatalog: [...(draft.tagsCatalog ?? []), { name: '', slug: '', color: '#6366f1' }],
                    })
                  }
                >
                  Añadir etiqueta
                </Button>
              </CardContent>
            </Card>
          )}

	          {activeSection === 'days' && (
	            <Card
	              className="shadow-md [&>div]:gap-3 [&>div]:p-3 md:[&>div]:gap-5 md:[&>div]:p-6"
	              data-onboarding="days-section"
	            >
	        <CardHeader className="gap-1 p-3 pb-1 md:pb-3">
          <CardTitle>Días del itinerario</CardTitle>
          <CardDescription>Organiza cada día con una vista más limpia: detalles arriba, actividades al centro y notas a un lado.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 overflow-hidden p-3 pt-0 md:space-y-6 md:p-4 md:pt-0">
                <DaySelectorCarousel
                  days={draft.days}
                  currentIndex={activeDayIndex}
                  onDayChange={setActiveDayIndex}
                  tagsCatalog={draft.tagsCatalog}
                />

                {activeDay && (
                  <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/80 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Día {String(activeDayIndex + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {activeDay.city || activeDay.dayLabel || 'Nuevo día'}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activeDay.schedule.length} {activeDay.schedule.length === 1 ? 'actividad' : 'actividades'} · {activeDay.notes.length} {activeDay.notes.length === 1 ? 'nota' : 'notas'}
                        </p>
                      </div>
                      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateDraft({
                              days: moveItem(draft.days, activeDayIndex, Math.max(0, activeDayIndex - 1)),
                            })
                          }
                          disabled={activeDayIndex === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateDraft({
                              days: moveItem(
                                draft.days,
                                activeDayIndex,
                                Math.min(draft.days.length - 1, activeDayIndex + 1),
                              ),
                            })
                          }
                          disabled={activeDayIndex === draft.days.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="col-span-3 sm:col-span-1"
                          onClick={() => {
                            const next = draft.days.filter((_, i) => i !== activeDayIndex);
                            updateDraft({ days: next });
                            setActiveDayIndex(prev => Math.max(0, Math.min(prev, next.length - 1)));
                          }}
                        >
                          Quitar día
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        value={activeDay.dayLabel}
                        onChange={event => updateDay(activeDayIndex, { dayLabel: event.target.value.slice(0, 24) })}
                        maxLength={24}
                        placeholder="Etiqueta día"
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        value={activeDay.date}
                        onChange={event => updateDay(activeDayIndex, { date: event.target.value })}
                        placeholder="Fecha"
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <select
                        value={activeDay.kind}
                        onChange={event => updateDay(activeDayIndex, { kind: event.target.value as ItineraryDay['kind'] })}
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: (draft.tagsCatalog ?? []).find(t => t.slug === activeDay.kind)?.color ?? '#6366f1',
                        }}
                      >
                        {(draft.tagsCatalog ?? []).map(tag => (
                          <option key={tag.slug} value={tag.slug}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={activeDay.city}
                        onChange={event => updateDay(activeDayIndex, { city: event.target.value.slice(0, 72) })}
                        maxLength={72}
                        placeholder="Ciudad"
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2"
                      />
                      <input
                        value={activeDay.plan}
                        onChange={event => updateDay(activeDayIndex, { plan: event.target.value })}
                        placeholder="Plan resumido"
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        value={(activeDay.tags ?? []).join(', ')}
                        onChange={event => updateDay(activeDayIndex, { tags: splitLines(event.target.value.replace(/,/g, '\n')) })}
                        placeholder="Etiquetas del día"
                        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-3"
                      />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                      <section className="space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                              Actividades del día
                            </h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Edita lo esencial con un modal y deja gasto/documento en un segundo paso más limpio.
                            </p>
                          </div>
                          <Button
                            data-onboarding="days-add-schedule"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const nextSchedule = [
                                ...activeDay.schedule,
                                { time: '', activity: '', link: '', mapLink: '', lat: undefined, lng: undefined, tags: [] },
                              ];
                              updateDay(activeDayIndex, { schedule: nextSchedule });
                              setEditingActivity({ dayIndex: activeDayIndex, activityIndex: nextSchedule.length - 1 });
                            }}
                          >
                            Añadir actividad
                          </Button>
                        </div>

                        {activeDay.schedule.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            Este día todavía no tiene actividades. Añade la primera y edítala en modal para mantener la vista limpia.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activeDay.schedule.map((item, scheduleIndex) => {
                              const linkedDocument = item.documentId ? documentsById.get(item.documentId) : null;

                              return (
                                <div
                                  key={`${activeDay.id}-schedule-${scheduleIndex}`}
                                  className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {scheduleIndex + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            {item.time || 'Sin hora'}
                                          </span>
                                          <h5 className="min-w-0 truncate text-sm font-semibold text-foreground md:text-base">
                                            {item.activity || `Actividad ${scheduleIndex + 1}`}
                                          </h5>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                          {item.link && <span className="rounded-full border border-border bg-muted/25 px-2.5 py-1">Entradas</span>}
                                          {(item.mapLink || (item.lat !== undefined && item.lng !== undefined)) && (
                                            <span className="rounded-full border border-border bg-muted/25 px-2.5 py-1">Maps enlazado</span>
                                          )}
                                          {(item.tags ?? []).length > 0 && (
                                            <span className="rounded-full border border-border bg-muted/25 px-2.5 py-1">
                                              {(item.tags ?? []).length} etiquetas
                                            </span>
                                          )}
                                          {item.cost && (
                                            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-primary">
                                              {item.cost.toFixed(2)} {item.costCurrency ?? 'EUR'}
                                            </span>
                                          )}
                                          {linkedDocument && (
                                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-800">
                                              {linkedDocument.title}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                  </div>

                                  <div className="mt-3 grid gap-2 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:items-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const next = moveItem(activeDay.schedule, scheduleIndex, Math.max(0, scheduleIndex - 1));
                                        updateDay(activeDayIndex, { schedule: next });
                                      }}
                                      disabled={scheduleIndex === 0}
                                    >
                                      ↑
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const next = moveItem(
                                          activeDay.schedule,
                                          scheduleIndex,
                                          Math.min(activeDay.schedule.length - 1, scheduleIndex + 1),
                                        );
                                        updateDay(activeDayIndex, { schedule: next });
                                      }}
                                      disabled={scheduleIndex === activeDay.schedule.length - 1}
                                    >
                                      ↓
                                    </Button>
                                    <select
                                      value=""
                                      onChange={event => {
                                        const targetDayIndex = parseInt(event.target.value, 10);
                                        if (targetDayIndex !== activeDayIndex && targetDayIndex >= 0 && targetDayIndex < draft.days.length) {
                                          const activity = activeDay.schedule[scheduleIndex];
                                          const updatedCurrentDay = {
                                            ...activeDay,
                                            schedule: activeDay.schedule.filter((_, i) => i !== scheduleIndex),
                                          };
                                          const targetDay = draft.days[targetDayIndex];
                                          const updatedTargetDay = {
                                            ...targetDay,
                                            schedule: [...targetDay.schedule, activity],
                                          };
                                          const updatedDays = [...draft.days];
                                          updatedDays[activeDayIndex] = updatedCurrentDay;
                                          updatedDays[targetDayIndex] = updatedTargetDay;
                                          updateDraft({ days: updatedDays });
                                        }
                                        event.target.value = '';
                                      }}
                                      className="min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-xs"
                                    >
                                      <option value="">Mover a otro día...</option>
                                      {draft.days.map((day, idx) => (
                                        <option key={day.id ?? idx} value={idx} disabled={idx === activeDayIndex}>
                                          {day.kind === 'flight' ? '✈️ Vuelo' : day.dayLabel} - {day.city}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="w-full md:w-auto"
                                      onClick={async () => {
                                        const itemToRemove = activeDay.schedule[scheduleIndex];

                                        if (itemToRemove.costSplitExpenseId) {
                                          try {
                                            const { supabase } = await import('../lib/supabase');
                                            await supabase
                                              .from('split_expenses')
                                              .delete()
                                              .eq('id', itemToRemove.costSplitExpenseId);
                                            toast.success('Gasto asociado eliminado');
                                          } catch (err) {
                                            console.error('Error borrando gasto asociado:', err);
                                            toast.error('Error al eliminar el gasto asociado');
                                          }
                                        }

                                        const next = activeDay.schedule.filter((_, i) => i !== scheduleIndex);
                                        updateDay(activeDayIndex, { schedule: next });
                                      }}
                                    >
                                      Quitar
                                    </Button>
                                  </div>

                                  <div className="mt-2 grid grid-cols-2 gap-2 md:flex md:justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingActivity({ dayIndex: activeDayIndex, activityIndex: scheduleIndex })}
                                      className="w-full md:w-auto"
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar actividad
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingActivityMeta({ dayIndex: activeDayIndex, activityIndex: scheduleIndex })}
                                      className="w-full md:w-auto"
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Gasto y documento
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">Notas del día</h4>
                            <p className="mt-1 text-sm text-muted-foreground">Observaciones rápidas para el bloque del día.</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDay(activeDayIndex, { notes: [...activeDay.notes, ''] })}
                          >
                            Añadir nota
                          </Button>
                        </div>

                        {activeDay.notes.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground">
                            Todavía no has añadido notas para este día.
                          </p>
                        ) : (
                          activeDay.notes.map((note, noteIndex) => (
                            <div key={`${activeDay.id}-note-${noteIndex}`} className="flex items-center gap-2">
                              <input
                                value={note}
                                onChange={event => {
                                  const next = [...activeDay.notes];
                                  next[noteIndex] = event.target.value;
                                  updateDay(activeDayIndex, { notes: next });
                                }}
                                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const next = activeDay.notes.filter((_, i) => i !== noteIndex);
                                  updateDay(activeDayIndex, { notes: next });
                                }}
                              >
                                Quitar
                              </Button>
                            </div>
                          ))
                        )}
                      </section>
                    </div>
                  </div>
                )}

          <Button
            variant="outline"
            onClick={() => {
              const newDay: ItineraryDay = {
                id: createTempId(),
                dayLabel: String(draft.days.length + 1),
                date: '',
                city: '',
                plan: '',
                notes: [],
                kind: 'city',
                schedule: [],
                tags: [],
              };
              const nextDays = [...draft.days, newDay];
              updateDraft({ days: nextDays });
              setActiveDayIndex(nextDays.length - 1);
            }}
          >
            Añadir día
          </Button>
        </CardContent>
      </Card>
	          )}
        </div>

        {editingActivity && (
          <ActivityEditModal
            key={`activity-${editingActivity.dayIndex}-${editingActivity.activityIndex}`}
            isOpen
            onClose={() => setEditingActivity(null)}
            item={draft.days[editingActivity.dayIndex].schedule[editingActivity.activityIndex]}
            onSave={(updatedItem) => {
              updateScheduleItem(editingActivity.dayIndex, editingActivity.activityIndex, updatedItem);
              setEditingActivity(null);
            }}
          />
        )}

        {editingActivityMeta && (
          <ActivityAdminMetaModal
            key={`activity-meta-${editingActivityMeta.dayIndex}-${editingActivityMeta.activityIndex}`}
            isOpen
            onClose={() => setEditingActivityMeta(null)}
            item={draft.days[editingActivityMeta.dayIndex].schedule[editingActivityMeta.activityIndex]}
            onSave={async (updatedItem) => {
              if (!draft) return;

              const days = [...draft.days];
              const schedule = [...days[editingActivityMeta.dayIndex].schedule];
              schedule[editingActivityMeta.activityIndex] = updatedItem;
              days[editingActivityMeta.dayIndex] = {
                ...days[editingActivityMeta.dayIndex],
                schedule,
              };
              const nextDraft = { ...draft, days };

              setDraft(nextDraft);
              const saved = await persistDraft(nextDraft, 'Actividad guardada automáticamente');
              if (saved) {
                setEditingActivityMeta(null);
              }
              return saved;
            }}
            splitMembers={splitMembers}
            documents={itineraryDocuments}
            itineraryId={draft?.id}
            onCreateDocument={handleCreateActivityDocument}
            onManageDocuments={draft?.id ? () => navigate(`/app/documents?itineraryId=${draft.id}`) : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default AdminItinerary;

