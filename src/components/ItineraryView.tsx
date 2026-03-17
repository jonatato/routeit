/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Maximize2, Plus, Search, Ticket, Wallet } from 'lucide-react';
import type { TravelItinerary, Flight, FlightSegment, ItineraryDay, ScheduleItem } from '../data/itinerary';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { PandaLogo } from './PandaLogo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs as UITabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DaySelectorCarousel } from './DaySelectorCarousel';
import { FlightCarousel } from './FlightCarousel';
import { fetchSectionPreferences, type SectionPreference } from '../services/sections';
import { supabase } from '../lib/supabase';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { PDFExportDialog } from './PDFExportDialog';
import { MapModal } from './MapModal';
import { useIsMobileShell } from '../hooks/useIsMobileShell';
import { downloadFlightICS } from '../utils/calendarExport';
import { getItineraryStartDate } from '../utils/itineraryDates';
import { listItineraryDocuments, type ItineraryDocument } from '../services/documents';
import { isBase64Document } from '../utils/documentPreview';
import TripCountdown from './TripCountdown';

const budgetToneClasses = {
  secondary: 'bg-secondary',
  primary: 'bg-primary',
  accent: 'bg-accent',
} as const;

const SHOW_COVER_IMAGE = false;
const SHOW_PDF_EXPORT = false;

const formatActivityCount = (count: number) => `${count} ${count === 1 ? 'actividad' : 'actividades'}`;

const normalizeCityName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const cityMatches = (left: string, right: string) => {
  const normalizedLeft = normalizeCityName(left);
  const normalizedRight = normalizeCityName(right);

  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
};

const getRenderableRouteLocations = (locations: TravelItinerary['locations']) => {
  const seen = new Set<string>();

  return locations.filter(location => {
    const city = location.city.trim();
    const hasCoords =
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng) &&
      !(location.lat === 0 && location.lng === 0);

    if (!city || !hasCoords) return false;

    const normalizedCity = city.toLowerCase();
    if (seen.has(normalizedCity)) return false;

    seen.add(normalizedCity);
    return true;
  });
};

type DayDetailPanelProps = {
  day: ItineraryDay;
  compact?: boolean;
  checkedItems: string[];
  onToggleItem: (itemIndex: number) => void;
  documentsById: Map<string, ItineraryDocument>;
  onOpenDocument: (document: ItineraryDocument) => void;
};

function ActivityTimelineCard({
  item,
  checked,
  onToggle,
  isFirst,
  isLast,
  linkedDocument,
  compact = false,
  onOpenDocument,
}: {
  item: ScheduleItem;
  checked: boolean;
  onToggle: () => void;
  isFirst: boolean;
  isLast: boolean;
  linkedDocument?: ItineraryDocument | null;
  compact?: boolean;
  onOpenDocument: (document: ItineraryDocument) => void;
}) {
  const hasTags = Boolean(item.tags && item.tags.length > 0);
  const hasMeta = Boolean(item.link || item.mapLink || item.cost || linkedDocument);

  return (
    <div className={`grid items-start ${compact ? 'grid-cols-[24px_1fr] gap-3' : 'grid-cols-[28px_1fr] gap-4'}`}>
      <div className="relative flex h-full justify-center">
        {!isFirst && (
          <>
            <span className="absolute left-1/2 top-0 h-[calc(50%-9px)] w-px -translate-x-1/2 bg-border/80" />
            <span
              className={`absolute left-1/2 top-0 h-[calc(50%-9px)] w-px -translate-x-1/2 origin-bottom bg-primary transition-transform duration-500 ${
                checked ? 'scale-y-100' : 'scale-y-0'
              }`}
            />
          </>
        )}

        <span
          className={`relative z-10 mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-500 ${
            checked
              ? 'border-primary bg-primary ring-4 ring-primary/10'
              : 'border-primary/40 bg-background'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              checked ? 'scale-100 bg-primaryForeground' : 'scale-75 bg-primary/65'
            }`}
          />
        </span>

        {!isLast && (
          <>
            <span className="absolute bottom-0 left-1/2 h-[calc(50%-1px)] w-px -translate-x-1/2 bg-border/80" />
            <span
              className={`absolute bottom-0 left-1/2 h-[calc(50%-1px)] w-px -translate-x-1/2 origin-top bg-primary transition-transform duration-500 ${
                checked ? 'scale-y-100' : 'scale-y-0'
              }`}
            />
          </>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        className={`min-w-0 rounded-lg transition-[opacity,transform] duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
          checked ? 'opacity-60' : 'opacity-100'
        }`}
        aria-pressed={checked}
        aria-label={checked ? 'Marcar actividad como pendiente' : 'Marcar actividad como completada'}
      >
        <div className={compact ? 'space-y-2 pb-2' : 'space-y-2.5 pb-3'}>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-500 ${
                  checked
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border/80 bg-muted/70 text-foreground/85'
                }`}
              >
                {item.time || '--:--'}
              </span>
              <h4
                className={`font-display leading-tight text-foreground ${
                  compact ? 'text-base font-bold' : 'text-lg font-extrabold'
                } ${checked ? 'line-through' : ''}`}
              >
                {item.activity || 'Sin actividad'}
              </h4>
            </div>

            {hasTags && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-mutedForeground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {hasMeta && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-mutedForeground">
              {typeof item.cost === 'number' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Wallet className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                  €{item.cost.toFixed(2)}
                </span>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-500/15 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                >
                  <Ticket className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                  Entradas
                </a>
              )}
              {item.mapLink && (
                <a
                  href={item.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={event => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-500/15 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300"
                >
                  <MapPin className="h-3 w-3 text-sky-600 dark:text-sky-300" />
                  Abrir Maps
                </a>
              )}
              {linkedDocument && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    onOpenDocument(linkedDocument);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/25 bg-amber-700/10 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-700/15 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200"
                  title={linkedDocument.title}
                >
                  <FileText className="h-3 w-3 text-amber-800 dark:text-amber-200" />
                  Documento
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayDetailPanel({ day, compact = false, checkedItems, onToggleItem, documentsById, onOpenDocument }: DayDetailPanelProps) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div
        className={`flex w-full items-start justify-between gap-3 rounded-[1.25rem] bg-transparent ${
          compact ? 'px-1 py-1' : 'px-1 py-2'
        }`}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mutedForeground">{day.date}</p>
          <h3 className={`font-display leading-none text-foreground ${compact ? 'truncate text-xl font-extrabold' : 'text-[1.75rem] font-extrabold'}`} title={day.city}>
            {day.city}
          </h3>
          {day.plan && (
            <p className={`text-mutedForeground ${compact ? 'line-clamp-2 text-sm' : 'max-w-3xl text-sm'}`}>
              {day.plan}
            </p>
          )}
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-muted/55 px-3 py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedForeground">
          {formatActivityCount(day.schedule.length)}
        </span>
      </div>
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {day.schedule.map((item, itemIndex) => {
          const checked = checkedItems.includes(`${day.id}-${itemIndex}`);
          const linkedDocument = item.documentId ? documentsById.get(item.documentId) ?? null : null;

          return (
            <ActivityTimelineCard
              key={`${day.id}-${item.time || 'no-time'}-${itemIndex}`}
              item={item}
              checked={checked}
              onToggle={() => onToggleItem(itemIndex)}
              isFirst={itemIndex === 0}
              isLast={itemIndex === day.schedule.length - 1}
              linkedDocument={linkedDocument}
              compact={compact}
              onOpenDocument={onOpenDocument}
            />
          );
        })}
      </div>
    </div>
  );
}

const getScheduleStorageKey = (itinerary: TravelItinerary) =>
  `routeit-schedule-checklist:${itinerary.id ?? itinerary.title}`;

// Helper para extraer código de aeropuerto de string como "Madrid (MAD)"
function extractAirportCode(cityStr: string): string {
  const match = cityStr.match(/\(([A-Z]{3})\)/);
  if (match) return match[1];
  // Fallback: use first 3 chars uppercase
  return cityStr.slice(0, 3).toUpperCase();
}

// Helper para extraer nombre de ciudad de string como "Madrid (MAD)"
function extractCityName(cityStr: string): string {
  const match = cityStr.match(/^(.+?)\s*\(/);
  if (match) return match[1].trim();
  return cityStr;
}

type ItineraryViewProps = {
  itinerary: TravelItinerary;
  editable?: boolean;
};

function ItineraryView({ itinerary, editable = false }: ItineraryViewProps) {
  const allDays = itinerary.days;
  const tagsCatalog = itinerary.tagsCatalog;
  const totalDays = allDays.length;
  const travelCount = allDays.filter(day => day.kind === 'travel').length;
  const tripStartDate = useMemo(() => getItineraryStartDate(itinerary), [itinerary]);
  const todayStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const isTripStarted = Boolean(tripStartDate && tripStartDate.getTime() <= todayStart.getTime());
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [activeTabValue, setActiveTabValue] = useState('0');
  const isMobile = useIsMobileShell();
  const [sectionPreferences, setSectionPreferences] = useState<SectionPreference[]>([]);
  const [sliderHeight, setSliderHeight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [itineraryDocuments, setItineraryDocuments] = useState<ItineraryDocument[]>([]);
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [currentListIndex, setCurrentListIndex] = useState(0);
  const [listDragOffset, setListDragOffset] = useState(0);
  const [isListDragging, setIsListDragging] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDayMapModalOpen, setIsDayMapModalOpen] = useState(false);
  const [dayMapModalData, setDayMapModalData] = useState<{
    center: [number, number];
    points: Array<{ lat: number; lng: number; time: string; label: string; city: string; region: string }>;
  } | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const swipeState = useRef({ startX: 0, deltaX: 0, isDragging: false });
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const listStartX = useRef(0);
  const listStartTime = useRef(0);
  const mapDragState = useRef({ startX: 0, startY: 0, dragged: false });
  const dayMapDragState = useRef({ startX: 0, startY: 0, dragged: false });

  const handleOpenDocument = (document: ItineraryDocument) => {
    try {
      if (isBase64Document(document.url)) {
        setPreviewDocument({ title: document.title, url: document.url });
        return;
      }

      window.open(document.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening itinerary document:', error);
    }
  };

  const handleMapPointerDown = (state: typeof mapDragState) => (event: ReactPointerEvent) => {
    state.current.startX = event.clientX;
    state.current.startY = event.clientY;
    state.current.dragged = false;
  };

  const handleMapPointerMove = (state: typeof mapDragState) => (event: ReactPointerEvent) => {
    if (state.current.dragged) return;
    const dx = Math.abs(event.clientX - state.current.startX);
    const dy = Math.abs(event.clientY - state.current.startY);
    if (dx > 6 || dy > 6) {
      state.current.dragged = true;
    }
  };

  const shouldOpenMapModal = (state: typeof mapDragState) => {
    if (state.current.dragged) {
      state.current.dragged = false;
      return false;
    }
    return true;
  };
  
  // Convert legacy flights to new format if flightsList is not available
  const flightsList: Flight[] = useMemo(() => {
    // If new format is available, use it
    if (itinerary.flightsList && itinerary.flightsList.length > 0) {
      return itinerary.flightsList;
    }
    // Convert legacy format to new format
    const legacyFlights: Flight[] = [];
    if (itinerary.flights?.outbound) {
      const outbound = itinerary.flights.outbound;
      legacyFlights.push({
        id: 'legacy-outbound',
        direction: 'outbound',
        date: outbound.date,
        status: 'confirmed',
        totalDuration: outbound.duration,
        stops: outbound.stops === 'Directo' ? 0 : 1,
        segments: [{
          id: 'legacy-outbound-seg-1',
          departureAirport: extractAirportCode(outbound.fromCity),
          departureCity: extractCityName(outbound.fromCity),
          departureTime: outbound.fromTime,
          arrivalAirport: extractAirportCode(outbound.toCity),
          arrivalCity: extractCityName(outbound.toCity),
          arrivalTime: outbound.toTime,
          duration: outbound.duration,
        }],
      });
    }
    if (itinerary.flights?.inbound) {
      const inbound = itinerary.flights.inbound;
      legacyFlights.push({
        id: 'legacy-inbound',
        direction: 'inbound',
        date: inbound.date,
        status: 'confirmed',
        totalDuration: inbound.duration,
        stops: inbound.stops === 'Directo' ? 0 : 1,
        segments: [{
          id: 'legacy-inbound-seg-1',
          departureAirport: extractAirportCode(inbound.fromCity),
          departureCity: extractCityName(inbound.fromCity),
          departureTime: inbound.fromTime,
          arrivalAirport: extractAirportCode(inbound.toCity),
          arrivalCity: extractCityName(inbound.toCity),
          arrivalTime: inbound.toTime,
          duration: inbound.duration,
        }],
      });
    }
    return legacyFlights;
  }, [itinerary.flightsList, itinerary.flights]);

  const mapCenter = useMemo(() => [33.5, 111.5] as [number, number], []);
  const routeLocations = useMemo(() => getRenderableRouteLocations(itinerary.locations), [itinerary.locations]);
  const routePositions = useMemo(() => {
    return routeLocations.map(location => [location.lat, location.lng] as [number, number]);
  }, [routeLocations]);
  const cityOptions = useMemo(() => itinerary.locations.map(location => location.city), [itinerary.locations]);
  const tagFilters = useMemo(() => {
    const tagSet = new Set<string>();
    allDays.forEach(day => {
      day.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).map(tag => ({
      id: `tag:${tag}`,
      label: tag,
      predicate: (day: typeof allDays[number]) => day.tags?.includes(tag) ?? false,
    }));
  }, [allDays]);

  const baseFilters = useMemo(
    () => [
      { id: 'kind:city', label: 'Ciudad', predicate: (day: typeof allDays[number]) => day.kind === 'city' },
      { id: 'kind:travel', label: 'Traslado', predicate: (day: typeof allDays[number]) => day.kind === 'travel' },
      { id: 'kind:flight', label: 'Vuelo', predicate: (day: typeof allDays[number]) => day.kind === 'flight' },
      {
        id: 'tag:food',
        label: 'Comida',
        keywords: ['comida', 'almuerzo', 'cena', 'desayuno', 'hotpot', 'snack', 'noodles', 'brunch'],
      },
      {
        id: 'tag:transport',
        label: 'Transporte',
        keywords: ['tren', 'vuelo', 'traslado', 'taxi', 'metro', 'aeropuerto', 'estación', 'check-in'],
      },
      {
        id: 'tag:culture',
        label: 'Cultura',
        keywords: ['templo', 'museo', 'histórico', 'hutong', 'ciudad prohibida', 'muralla', 'torre'],
      },
      {
        id: 'tag:nature',
        label: 'Naturaleza',
        keywords: ['parque', 'montaña', 'mirador', 'cascada', 'río', 'jardín', 'sendero', 'paseo'],
      },
      {
        id: 'tag:shopping',
        label: 'Compras',
        keywords: ['compras', 'mercado', 'road', 'street', 'shopping'],
      },
    ],
    [allDays],
  );

  const filterOptions = useMemo(() => [...baseFilters, ...tagFilters], [baseFilters, tagFilters]);
  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const trimDisplayText = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;


  const renderHtml = (value: string) => ({
    __html: sanitizeHtml(value),
  });

  const buildListHtml = (items: string[]) => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
  };

  const extractListItems = (items: string[]) => {
    if (items.length === 0) return [];
    if (items.length > 1) return items;
    const value = items[0] ?? '';
    if (!value) return [];
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return [value];
    }
    const doc = new DOMParser().parseFromString(value, 'text/html');
    const listItems = Array.from(doc.querySelectorAll('li'))
      .map(node => node.textContent?.trim() ?? '')
      .filter(Boolean);
    if (listItems.length > 0) return listItems;
    const text = doc.body.textContent ?? '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  };

  const filteredDays = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());
    // Aplicar búsqueda/filtros
    const filtered = allDays.filter(day => {
      // Incluir todos los días (flight, travel, city)
      
      const haystack = [
        day.city,
        day.plan,
        day.notes.join(' '),
        day.schedule.map(item => item.activity).join(' '),
      ]
        .join(' ');
      const normalizedHaystack = normalizeText(haystack);
      const matchesSearch = !normalizedQuery || normalizedHaystack.includes(normalizedQuery);
      const matchesFilter =
        activeFilters.length === 0 ||
        activeFilters.some(filterId => {
          const option = filterOptions.find(item => item.id === filterId);
          if (!option) return true;
          if ('predicate' in option && option.predicate) {
            return option.predicate(day);
          }
          if ('keywords' in option) {
            return option.keywords.some(keyword => normalizedHaystack.includes(normalizeText(keyword)));
          }
          return true;
        });
      return matchesSearch && matchesFilter;
    });
    
    // Recalcular numeración: el primer día después del vuelo es "Día 1"
    return filtered.map((day) => {
      // Encontrar la posición original de este día en allDays
      const dayIndexInAll = allDays.findIndex(d => d.id === day.id);
      // Contar cuántos días de vuelo hay antes de este día
      const flightsBefore = allDays.slice(0, dayIndexInAll).filter(d => d.kind === 'flight').length;
      // Si el dayLabel es numérico, recalcularlo
      const numericLabel = parseInt(day.dayLabel, 10);
      if (!isNaN(numericLabel)) {
        const newLabel = numericLabel - flightsBefore;
        return { ...day, dayLabel: String(newLabel) };
      }
      return day;
    });
  }, [activeFilters, allDays, filterOptions, searchQuery]);
  const visibleDays = filteredDays.length;
  const scheduleStorageKey = useMemo(() => getScheduleStorageKey(itinerary), [itinerary]);
  const currentDay = filteredDays[currentDayIndex];
  const routeStops = useMemo(
    () =>
      routeLocations.map(location => ({
        city: location.city,
        label: location.label,
        position: [location.lat, location.lng] as [number, number],
        dayIndex: filteredDays.findIndex(day => cityMatches(day.city, location.city)),
      })),
    [filteredDays, routeLocations],
  );
  const documentsById = useMemo(
    () => new Map(itineraryDocuments.map(document => [document.id, document] as const)),
    [itineraryDocuments],
  );
  const currentDayLocation = useMemo(() => {
    if (!currentDay) return null;
    const segments = currentDay.city.split('→').map(part => part.trim()).reverse();
    for (const segment of segments) {
      const match = itinerary.locations.find(location =>
        cityMatches(segment, location.city),
      );
      if (match) return match;
    }
    return null;
  }, [currentDay, itinerary.locations]);
  const dayMapPoints = useMemo(() => {
    if (!currentDay) return [];
    return currentDay.schedule
      .filter(item => typeof item.lat === 'number' && typeof item.lng === 'number')
      .map(item => ({
        position: [item.lat as number, item.lng as number] as [number, number],
        label: item.activity,
        time: item.time,
      }));
  }, [currentDay]);
  const dayMapCenter = useMemo(() => {
    if (dayMapPoints.length > 0) {
      return dayMapPoints[0].position;
    }
    if (currentDayLocation) {
      return [currentDayLocation.lat, currentDayLocation.lng] as [number, number];
    }
    return mapCenter;
  }, [dayMapPoints, currentDayLocation, mapCenter]);
  const activeRouteIndex = useMemo(() => {
    if (!currentDay) return -1;

    let progressedRouteIndex = -1;
    routeStops.forEach((stop, stopIndex) => {
      if (stop.dayIndex >= 0 && stop.dayIndex <= currentDayIndex) {
        progressedRouteIndex = stopIndex;
      }
    });

    if (progressedRouteIndex >= 0) return progressedRouteIndex;

    if (currentDayLocation) {
      const locationIndex = routeStops.findIndex(stop => cityMatches(stop.city, currentDayLocation.city));
      if (locationIndex >= 0) return locationIndex;
    }

    return routeStops.findIndex(stop => cityMatches(currentDay.city, stop.city));
  }, [currentDay, currentDayIndex, currentDayLocation, routeStops]);
  const activeRoutePositions = useMemo(() => {
    if (activeRouteIndex < 0) return [] as [number, number][];
    return routeStops.slice(0, activeRouteIndex + 1).map(stop => stop.position);
  }, [activeRouteIndex, routeStops]);
  const renderInlineGeneralMap = (compact = false) => (
    <div className="space-y-3" ref={mapSectionRef}>
      <div
        className={`group relative overflow-hidden border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,245,255,0.88))] shadow-[0_10px_30px_rgba(91,33,182,0.06)] ${
          compact ? 'rounded-[1.2rem]' : 'rounded-[1.35rem]'
        }`}
        onPointerDown={handleMapPointerDown(mapDragState)}
        onPointerMove={handleMapPointerMove(mapDragState)}
        onPointerCancel={() => {
          mapDragState.current.dragged = false;
        }}
        onClick={() => {
          if (!shouldOpenMapModal(mapDragState)) return;
          setIsMapModalOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!shouldOpenMapModal(mapDragState)) return;
            setIsMapModalOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Abrir mapa general del viaje"
      >
        <div className={compact ? 'h-44 w-full' : 'h-56 w-full md:h-64'}>
          {isMapVisible && (
            <MapContainer center={mapCenter} zoom={4} className="h-full w-full" ref={mapRef}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline positions={routePositions} pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.9 }} />
              {activeRoutePositions.length > 1 && (
                <Polyline positions={activeRoutePositions} pathOptions={{ color: '#2563eb', weight: 4 }} />
              )}
              {routeStops.map((stop, stopIndex) => {
                const isActiveStop = stopIndex === activeRouteIndex;

                return (
                  <CircleMarker
                    key={`${compact ? 'compact' : 'desktop'}-${stop.city}`}
                    center={stop.position}
                    radius={compact ? (isActiveStop ? 6 : 4.5) : isActiveStop ? 7 : 5}
                    pathOptions={{
                      color: isActiveStop ? '#2563eb' : '#ffffff',
                      weight: isActiveStop ? 3 : 2,
                      fillColor: isActiveStop ? '#2563eb' : '#0f172a',
                      fillOpacity: 1,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      {stop.label}
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-background/92 via-background/45 to-transparent px-3 py-2">
          <span className="rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedForeground backdrop-blur-sm">
            {activeRouteIndex >= 0 ? `Ruta · ${routeStops[activeRouteIndex]?.city}` : 'Ruta del viaje'}
          </span>
          <div className={`rounded-full border border-white/60 bg-white/70 p-2 backdrop-blur-sm transition-opacity ${compact ? 'opacity-0 group-active:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <Maximize2 className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {routeStops.map((stop, stopIndex) => {
          const isActiveStop = stopIndex === activeRouteIndex;
          const canNavigate = stop.dayIndex >= 0;

          return (
            <button
              key={`${compact ? 'mobile' : 'desktop'}-route-stop-${stop.city}`}
              type="button"
              onClick={() => {
                if (!canNavigate) return;
                setCurrentDayIndex(stop.dayIndex);
                setActiveTabValue(String(stop.dayIndex));
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActiveStop
                  ? 'border-primary/35 bg-primary/10 text-primary'
                  : 'border-border/60 bg-background/70 text-mutedForeground hover:border-primary/20 hover:bg-background hover:text-foreground'
              } ${!canNavigate ? 'cursor-default opacity-45' : ''}`}
              aria-pressed={isActiveStop}
              disabled={!canNavigate}
            >
              {stop.city}
            </button>
          );
        })}
      </div>
    </div>
  );

  const shouldShowDayMap = dayMapPoints.length > 0;
  const checklistItems = useMemo(() => extractListItems(itinerary.utilities), [itinerary.utilities]);
  const checklistProgress = useMemo(() => {
    if (checklistItems.length === 0) return 0;
    return Math.round((checkedItems.length / checklistItems.length) * 100);
  }, [checkedItems.length, checklistItems.length]);
  const routeLegs = useMemo(() => {
    return allDays
      .filter(day => day.city.includes('→'))
      .map(day => ({
        id: day.id,
        label: day.dayLabel,
        city: day.city,
        kind: day.kind,
      }));
  }, [allDays]);
  const listCards = useMemo(() => {
    const cards: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
      content: string[];
    }> = [];

    if (itinerary.foods?.length > 0) {
      cards.push({
        id: 'foods',
        icon: '🍜',
        title: 'Comidas típicas',
        description: 'Ideas para probar en cada parada.',
        content: itinerary.foods,
      });
    }
    if (itinerary.tips?.length > 0) {
      cards.push({
        id: 'tips',
        icon: '💡',
        title: 'Consejos',
        description: 'Tips esenciales para tu viaje.',
        content: itinerary.tips,
      });
    }
    if (itinerary.avoid?.length > 0) {
      cards.push({
        id: 'avoid',
        icon: '⚠️',
        title: 'Cosas a evitar',
        description: 'Errores comunes que debes evitar.',
        content: itinerary.avoid,
      });
    }
    if (itinerary.utilities?.length > 0) {
      cards.push({
        id: 'utilities',
        icon: '📱',
        title: 'Utilidades',
        description: 'Apps y herramientas recomendadas.',
        content: itinerary.utilities,
      });
    }
    if (itinerary.packing?.length > 0) {
      cards.push({
        id: 'packing',
        icon: '🧳',
        title: 'Checklist de maleta',
        description: 'No olvides empacar estos items.',
        content: itinerary.packing,
      });
    }
    if (itinerary.money?.length > 0) {
      cards.push({
        id: 'money',
        icon: '💰',
        title: 'Dinero y pagos',
        description: 'Métodos de pago y consejos financieros.',
        content: itinerary.money,
      });
    }
    if (itinerary.connectivity?.length > 0) {
      cards.push({
        id: 'connectivity',
        icon: '📶',
        title: 'Conectividad',
        description: 'Internet, VPN y comunicaciones.',
        content: itinerary.connectivity,
      });
    }
    if (itinerary.transport?.length > 0) {
      cards.push({
        id: 'transport',
        icon: '🚆',
        title: 'Transporte',
        description: 'Opciones de movilidad local.',
        content: itinerary.transport,
      });
    }
    if (itinerary.safety?.length > 0) {
      cards.push({
        id: 'safety',
        icon: '🛡️',
        title: 'Seguridad',
        description: 'Mantente seguro durante el viaje.',
        content: itinerary.safety,
      });
    }
    if (itinerary.etiquette?.length > 0) {
      cards.push({
        id: 'etiquette',
        icon: '🎎',
        title: 'Etiqueta local',
        description: 'Costumbres y normas culturales.',
        content: itinerary.etiquette,
      });
    }
    if (itinerary.weather?.length > 0) {
      cards.push({
        id: 'weather',
        icon: '🌤️',
        title: 'Clima',
        description: 'Condiciones meteorológicas esperadas.',
        content: itinerary.weather,
      });
    }
    if (itinerary.scams?.length > 0) {
      cards.push({
        id: 'scams',
        icon: '🚨',
        title: 'Estafas comunes',
        description: 'Fraudes a evitar en destino.',
        content: itinerary.scams,
      });
    }
    if (itinerary.budgetTips?.length > 0) {
      cards.push({
        id: 'budgetTips',
        icon: '💵',
        title: 'Presupuesto inteligente',
        description: 'Ahorra sin sacrificar experiencias.',
        content: itinerary.budgetTips,
      });
    }
    if (itinerary.emergency?.length > 0) {
      cards.push({
        id: 'emergency',
        icon: '🆘',
        title: 'Emergencias',
        description: 'Contactos y procedimientos de emergencia.',
        content: itinerary.emergency,
      });
    }

    return cards;
  }, [
    itinerary.avoid,
    itinerary.budgetTips,
    itinerary.connectivity,
    itinerary.emergency,
    itinerary.etiquette,
    itinerary.foods,
    itinerary.money,
    itinerary.packing,
    itinerary.safety,
    itinerary.scams,
    itinerary.tips,
    itinerary.transport,
    itinerary.utilities,
    itinerary.weather,
  ]);

  useEffect(() => {
    if (listCards.length === 0) {
      if (currentListIndex !== 0) {
        setCurrentListIndex(0);
      }
      return;
    }

    if (currentListIndex > listCards.length - 1) {
      setCurrentListIndex(0);
    }
  }, [currentListIndex, listCards.length]);

  const goToIndex = (index: number) => {
    if (visibleDays === 0) return;
    const newIndex = Math.min(Math.max(0, index), visibleDays - 1);
    setCurrentDayIndex(newIndex);
    setActiveTabValue(String(newIndex));
  };

  const canGoPrevList = currentListIndex > 0;
  const canGoNextList = currentListIndex < listCards.length - 1;

  const handleListTouchStart = (e: React.TouchEvent) => {
    listStartX.current = e.touches[0].clientX;
    listStartTime.current = Date.now();
    setIsListDragging(true);
  };

  const handleListTouchMove = (e: React.TouchEvent) => {
    if (!isListDragging) return;
    const deltaX = e.touches[0].clientX - listStartX.current;
    setListDragOffset(deltaX);
  };

  const handleListTouchEnd = () => {
    if (!isListDragging) return;

    const deltaTime = Date.now() - listStartTime.current;
    const velocity = Math.abs(listDragOffset) / deltaTime;
    const threshold = 50;
    const velocityThreshold = 0.3;

    if (Math.abs(listDragOffset) > threshold || velocity > velocityThreshold) {
      if (listDragOffset > 0 && canGoPrevList) {
        setCurrentListIndex(currentListIndex - 1);
      } else if (listDragOffset < 0 && canGoNextList) {
        setCurrentListIndex(currentListIndex + 1);
      }
    }

    setIsListDragging(false);
    setListDragOffset(0);
  };

  // Resetear índice cuando cambian los filtros o la búsqueda
  useEffect(() => {
    if (filteredDays.length === 0) {
      setCurrentDayIndex(0);
      return;
    }
    // Si el índice actual está fuera de rango, resetear al primero
    if (currentDayIndex >= filteredDays.length) {
      setCurrentDayIndex(0);
      setActiveTabValue('0');
    }
  }, [filteredDays.length]);

  // Sincronizar tab con índice del día
  useEffect(() => {
    // No sobrescribir si el tab actual es "general"
    if (activeTabValue !== 'general') {
      setActiveTabValue(String(currentDayIndex));
    }
  }, [currentDayIndex]);

  // Sincronizar índice del día con tab
  useEffect(() => {
    const tabValue = activeTabValue;
    if (tabValue === 'general') {
      // No cambiar currentDayIndex para el tab general
      return;
    }
    const index = Number(tabValue);
    if (!isNaN(index) && index >= 0 && index < filteredDays.length && index !== currentDayIndex) {
      setCurrentDayIndex(index);
    }
  }, [activeTabValue, filteredDays.length]);

  // Cargar preferencias de secciones
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }
        const prefs = await fetchSectionPreferences();
        setSectionPreferences(prefs);
      } catch (error) {
        console.error('Error loading section preferences:', error);
        setSectionPreferences([]);
      }
    };
    void loadPreferences();
  }, []);

  useEffect(() => {
    if (!itinerary.id) {
      setItineraryDocuments([]);
      return;
    }

    let isActive = true;

    const loadDocuments = async () => {
      try {
        const documents = await listItineraryDocuments(itinerary.id);
        if (isActive) {
          setItineraryDocuments(documents);
        }
      } catch (error) {
        console.error('Error loading itinerary documents for view:', error);
        if (isActive) {
          setItineraryDocuments([]);
        }
      }
    };

    void loadDocuments();

    return () => {
      isActive = false;
    };
  }, [itinerary.id]);

  // Mapeo de secciones con su visibilidad y orden
  const sectionConfig = useMemo(() => {
    const config = new Map<string, { visible: boolean; order: number }>();
    const defaultOrder = isMobile
      ? ['flights', 'itinerary', 'flightInfo', 'overview', 'map', 'foods', 'budget']
      : ['flights', 'itinerary', 'flightInfo', 'overview', 'map', 'foods', 'budget'];

    defaultOrder.forEach((key, index) => {
      config.set(key, { visible: true, order: index });
    });

    if (sectionPreferences.length > 0) {
      sectionPreferences.forEach(pref => {
        config.set(pref.section_key, { visible: pref.is_visible, order: pref.order_index });
      });
    }

    return config;
  }, [isMobile, sectionPreferences]);

  const shouldShowSection = (key: string) => {
    if (key === 'itinerary') return true;
    const config = sectionConfig.get(key);
    return config ? config.visible : true;
  };

  const getSectionOrder = (key: string) => {
    const config = sectionConfig.get(key);
    return config ? config.order : 999;
  };

  const getPinnedSectionOrder = (key: string) => {
    if (key === 'flights') return -2;
    if (key === 'itinerary') return -1;
    return getSectionOrder(key);
  };

  const hasAnyVisibleMainSection = useMemo(
    () =>
      ['flights', 'itinerary', 'flightInfo', 'overview', 'map', 'foods', 'budget'].some(
        key => sectionConfig.get(key)?.visible ?? true,
      ),
    [sectionConfig],
  );

  const showItinerarySection = shouldShowSection('itinerary') || !hasAnyVisibleMainSection;
  const showInlineGeneralMap = shouldShowSection('map') && showItinerarySection && routeStops.length > 0;
  const showStandaloneGeneralMap = shouldShowSection('map') && !showItinerarySection;

  useEffect(() => {
    setCurrentDayIndex(index => Math.min(index, Math.max(visibleDays - 1, 0)));
  }, [visibleDays]);

  useEffect(() => {
    const updateHeight = () => {
      const currentSlide = slideRefs.current[currentDayIndex];
      if (currentSlide) {
        setSliderHeight(currentSlide.scrollHeight);
      }
    };
    const frame = requestAnimationFrame(updateHeight);
    window.addEventListener('resize', updateHeight);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateHeight);
    };
  }, [currentDayIndex]);

  useEffect(() => {
    const stored = localStorage.getItem(scheduleStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setCheckedItems(parsed);
        return;
      } catch {
        setCheckedItems([]);
      }
    }
    setCheckedItems([]);
  }, [scheduleStorageKey]);

  useEffect(() => {
    localStorage.setItem(scheduleStorageKey, JSON.stringify(checkedItems));
  }, [checkedItems, scheduleStorageKey]);

  const handleToggleDayItem = (day: ItineraryDay, itemIndex: number) => {
    const key = `${day.id}-${itemIndex}`;
    const isChecked = checkedItems.includes(key);

    setCheckedItems(prev =>
      isChecked ? prev.filter(itemKey => itemKey !== key) : prev.includes(key) ? prev : [...prev, key],
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem('routeit-a11y');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { contrast: boolean; largeText: boolean };
        setHighContrast(Boolean(parsed.contrast));
        setLargeText(Boolean(parsed.largeText));
      } catch {
        setHighContrast(false);
        setLargeText(false);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'routeit-a11y',
      JSON.stringify({ contrast: highContrast, largeText }),
    );
  }, [highContrast, largeText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToIndex(currentDayIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToIndex(currentDayIndex + 1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        goToIndex(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        goToIndex(visibleDays - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDayIndex, visibleDays]);

  useEffect(() => {
    if (!showInlineGeneralMap && !showStandaloneGeneralMap) return;

    const section = mapSectionRef.current;
    if (!section) return;

    const revealMap = () => {
      setIsMapVisible(true);
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    };

    revealMap();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            revealMap();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [showInlineGeneralMap, showStandaloneGeneralMap]);

  useEffect(() => {
    if (!isMapVisible) return;

    const frame = requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });

    return () => cancelAnimationFrame(frame);
  }, [currentDayIndex, isMapVisible, isMobile]);

  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const itineraryContainerRef = useRef<HTMLDivElement | null>(null);

  const handlePDFExport = async (options: import('../services/pdfExport').PDFExportOptions) => {
    if (!itineraryContainerRef.current) {
      throw new Error('No se pudo encontrar el contenedor del itinerario');
    }
    const { exportItineraryToPDF } = await import('../services/pdfExport');
    await exportItineraryToPDF(itinerary, itineraryContainerRef.current, options);
  };

  const handlePrint = () => {
    if (!SHOW_PDF_EXPORT) return;
    setShowPDFDialog(true);
  };

  return (
    <>
      {SHOW_PDF_EXPORT && showPDFDialog && (
        <PDFExportDialog
          isOpen={showPDFDialog}
          onExport={handlePDFExport}
          onCancel={() => setShowPDFDialog(false)}
        />
      )}
      <div
        ref={itineraryContainerRef}
        className={`min-h-screen bg-background text-foreground overflow-x-hidden ${
          highContrast ? 'a11y-contrast' : ''
        } ${largeText ? 'a11y-text-lg' : ''}`}
      >

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:py-10 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <section data-section="flights" className="grid gap-6" style={{ order: getPinnedSectionOrder('flights') }}>
          {SHOW_COVER_IMAGE && itinerary.coverImage && (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
              <img
                src={itinerary.coverImage}
                alt={itinerary.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              {itinerary.title}
            </h1>
            <p className="text-base font-medium text-mutedForeground">Del {itinerary.dateRange}</p>
            <div
              className="text-sm text-mutedForeground max-w-3xl"
              dangerouslySetInnerHTML={renderHtml(itinerary.intro)}
            />
            {SHOW_PDF_EXPORT && (
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full no-print" onClick={handlePrint}>
                  Exportar PDF
                </Button>
              </div>
            )}
            {!isTripStarted && tripStartDate && (
              <TripCountdown targetDate={tripStartDate} className="no-print" />
            )}
          </div>
        </section>

        {flightsList.length > 0 && (
          <section className="space-y-6" style={{ order: getSectionOrder('flightInfo') }}>
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold">Información de vuelos</h2>
            </div>
            <FlightCarousel
              flights={flightsList}
              editable={editable}
              onAddToCalendar={downloadFlightICS}
            />
          </section>
        )}

        {showStandaloneGeneralMap && (
          <section id="map" data-section="map" className="space-y-6" ref={mapSectionRef} style={{ order: getSectionOrder('map') }}>
          <div className="space-y-6">
            <Card className="relative z-0 overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="relative z-0 h-[420px] w-full cursor-pointer group"
                  onPointerDown={handleMapPointerDown(mapDragState)}
                  onPointerMove={handleMapPointerMove(mapDragState)}
                  onPointerCancel={() => {
                    mapDragState.current.dragged = false;
                  }}
                  onClick={() => {
                    if (!shouldOpenMapModal(mapDragState)) return;
                    setIsMapModalOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (!shouldOpenMapModal(mapDragState)) return;
                      setIsMapModalOpen(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Abrir mapa en pantalla completa"
                >
                  {isMapVisible && (
                    <>
                      <MapContainer center={mapCenter} zoom={5} className="h-full w-full" ref={mapRef}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Polyline positions={routePositions} pathOptions={{ color: '#2563eb', weight: 3 }} />
                        {itinerary.locations.map(location => (
                          <Marker key={location.city} position={[location.lat, location.lng]}>
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                              {location.label}
                            </Tooltip>
                            <Popup>{location.label}</Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                      <div className="absolute inset-0 bg-transparent group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-3 shadow-lg">
                          <Maximize2 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}

        {showItinerarySection && (
          <section id="itinerary" data-section="itinerary" className="space-y-4" style={{ order: getPinnedSectionOrder('itinerary') }}>
          {/* Desktop: Selector de días mejorado + Contenido */}
          {!isMobile && (
            <div className="w-full space-y-4">
              {/* Selector de días con navegación */}
              <DaySelectorCarousel
                days={filteredDays}
                currentIndex={currentDayIndex}
                onDayChange={(index) => {
                  setCurrentDayIndex(index);
                  setActiveTabValue(String(index));
                }}
                tagsCatalog={tagsCatalog}
              />
              {showInlineGeneralMap && renderInlineGeneralMap()}
              <div className="flex items-center gap-3">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Buscar actividad, lugar..."
                    className="w-full rounded-full border border-border bg-white px-4 py-2.5 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-label="Buscar en el itinerario"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground" />
                </div>
                {editable && (
                  <Link to="/app/admin?section=days" className="ml-auto shrink-0">
                    <Button size="sm" className="rounded-full whitespace-nowrap">
                      <Plus className="mr-1 h-4 w-4" />
                      Nuevo día
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Contenido del día seleccionado */}
              {filteredDays[currentDayIndex] && (() => {
                const day = filteredDays[currentDayIndex];
                return (
                  <>
                    <DayDetailPanel
                      day={day}
                      checkedItems={checkedItems}
                      onToggleItem={(itemIndex) => handleToggleDayItem(day, itemIndex)}
                      documentsById={documentsById}
                      onOpenDocument={handleOpenDocument}
                    />
                  {shouldShowDayMap && (
                    <div
                      key={`${day.id}-day-map`}
                      className="overflow-hidden rounded-xl border border-border cursor-pointer group relative"
                      onPointerDown={handleMapPointerDown(dayMapDragState)}
                      onPointerMove={handleMapPointerMove(dayMapDragState)}
                      onPointerCancel={() => {
                        dayMapDragState.current.dragged = false;
                      }}
                      onClick={() => {
                        if (!shouldOpenMapModal(dayMapDragState)) return;
                        setDayMapModalData({
                          center: dayMapCenter,
                          points: dayMapPoints.map(point => ({
                            lat: point.position[0],
                            lng: point.position[1],
                            time: point.time,
                            label: point.label,
                            city: day.city,
                            region: day.city,
                          })),
                        });
                        setIsDayMapModalOpen(true);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (!shouldOpenMapModal(dayMapDragState)) return;
                          setDayMapModalData({
                            center: dayMapCenter,
                            points: dayMapPoints.map(point => ({
                              lat: point.position[0],
                              lng: point.position[1],
                              time: point.time,
                              label: point.label,
                              city: day.city,
                              region: day.city,
                            })),
                          });
                          setIsDayMapModalOpen(true);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Abrir mapa del día en pantalla completa"
                    >
                      <div className="h-72 w-full md:h-80 lg:h-96">
                        <MapContainer key={`${day.id}-day-map-container`} center={dayMapCenter} zoom={12} className="h-full w-full">
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {dayMapPoints.map(point => (
                            <Marker key={`${point.time}-${point.label}`} position={point.position}>
                              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                {point.time} · {point.label}
                              </Tooltip>
                              <Popup>
                                {point.time} · {point.label}
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                      <div className="absolute inset-0 bg-transparent group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-3 shadow-lg">
                          <Maximize2 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                  </>
                );
              })()}
            </div>
          )}
          
          {/* Mobile: Selector de días mejorado con gestos */}
          {isMobile && (
            <>
              {/* Nuevo selector de días con swipe y dropdown */}
              <DaySelectorCarousel
                days={filteredDays}
                currentIndex={currentDayIndex}
                onDayChange={(index) => {
                  setCurrentDayIndex(index);
                  setActiveTabValue(String(index));
                }}
                tagsCatalog={tagsCatalog}
              />
              {showInlineGeneralMap && renderInlineGeneralMap(true)}
              <div className="flex items-center gap-3">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Buscar actividad, lugar..."
                    className="w-full rounded-full border border-border bg-white px-4 py-2.5 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-label="Buscar en el itinerario"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground" />
                </div>
                {editable && (
                  <Link to="/app/admin?section=days" className="ml-auto shrink-0">
                    <Button size="sm" className="rounded-full whitespace-nowrap">
                      <Plus className="mr-1 h-4 w-4" />
                      Nuevo día
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Contenido del día actual */}
              {filteredDays[currentDayIndex] && (() => {
                const day = filteredDays[currentDayIndex];
                const dayPoints = day.schedule
                  .filter(item => typeof item.lat === 'number' && typeof item.lng === 'number')
                  .map(item => ({
                    position: [item.lat as number, item.lng as number] as [number, number],
                    label: item.activity,
                    time: item.time,
                  }));
                const dayCenter = dayPoints.length > 0 
                  ? dayPoints[0].position 
                  : (currentDayLocation ? [currentDayLocation.lat, currentDayLocation.lng] as [number, number] : mapCenter);
                
                return (
                  <div key={day.id} className="mt-4 space-y-4">
                    <DayDetailPanel
                      day={day}
                      compact
                      checkedItems={checkedItems}
                      onToggleItem={(itemIndex) => handleToggleDayItem(day, itemIndex)}
                      documentsById={documentsById}
                      onOpenDocument={handleOpenDocument}
                    />
                    {dayPoints.length > 0 && (
                      <div
                        className="overflow-hidden rounded-xl border border-border cursor-pointer group relative"
                        onPointerDown={handleMapPointerDown(dayMapDragState)}
                        onPointerMove={handleMapPointerMove(dayMapDragState)}
                        onPointerCancel={() => {
                          dayMapDragState.current.dragged = false;
                        }}
                        onClick={() => {
                          if (!shouldOpenMapModal(dayMapDragState)) return;
                          setDayMapModalData({
                            center: dayCenter,
                            points: dayPoints.map(point => ({
                              lat: point.position[0],
                              lng: point.position[1],
                              time: point.time,
                              label: point.label,
                              city: day.city,
                              region: day.city,
                            })),
                          });
                          setIsDayMapModalOpen(true);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (!shouldOpenMapModal(dayMapDragState)) return;
                            setDayMapModalData({
                              center: dayCenter,
                              points: dayPoints.map(point => ({
                                lat: point.position[0],
                                lng: point.position[1],
                                time: point.time,
                                label: point.label,
                                city: day.city,
                                region: day.city,
                              })),
                            });
                            setIsDayMapModalOpen(true);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Abrir mapa del día en pantalla completa"
                      >
                        <div className="h-64 w-full">
                          <MapContainer center={dayCenter} zoom={12} className="h-full w-full">
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {dayPoints.map(point => (
                              <Marker key={`${point.time}-${point.label}`} position={point.position}>
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                  {point.time} · {point.label}
                                </Tooltip>
                                <Popup>
                                  {point.time} · {point.label}
                                </Popup>
                              </Marker>
                            ))}
                          </MapContainer>
                        </div>
                        <div className="absolute inset-0 bg-transparent active:bg-primary/10 dark:active:bg-primary/15 transition-colors flex items-center justify-center pointer-events-none">
                          <div className="opacity-0 group-active:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-3 shadow-lg">
                            <Maximize2 className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
          
          {visibleDays === 0 && (
            <Card>
              <CardContent className="space-y-2 p-6 text-sm text-mutedForeground">
                <p>No hay días que coincidan con la búsqueda o filtros.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilters([]);
                  }}
                >
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
        )}

        {shouldShowSection('foods') && (
          <section id="foods" data-section="lists" className="space-y-6" style={{ order: getSectionOrder('foods') }}>
            {/* Versión móvil: Carousel horizontal */}
            {isMobile && listCards.length > 0 && (
              <div className="space-y-4">
                {/* Navegación de pestañas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {listCards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => setCurrentListIndex(idx)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        idx === currentListIndex
                          ? 'border-primary/35 bg-primary/10 text-primary'
                          : 'border-border/60 bg-background/70 text-mutedForeground hover:border-primary/20 hover:bg-background hover:text-foreground'
                      }`}
                    >
                      <span>{card.icon}</span>
                      <span>{card.title}</span>
                    </button>
                  ))}
                </div>

                {/* Tarjeta actual con gestos swipe */}
                <div
                  className="touch-pan-y select-none"
                  onTouchStart={handleListTouchStart}
                  onTouchMove={handleListTouchMove}
                  onTouchEnd={handleListTouchEnd}
                >
                  <div
                    className="transition-transform duration-200"
                    style={{
                      transform: isListDragging ? `translateX(${listDragOffset}px)` : 'translateX(0)',
                    }}
                  >
                    {listCards[currentListIndex] && (
                      <Card key={listCards[currentListIndex].id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>{listCards[currentListIndex].icon}</span>
                            <span>{listCards[currentListIndex].title}</span>
                          </CardTitle>
                          <CardDescription>{listCards[currentListIndex].description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-mutedForeground prose prose-sm max-w-none">
                          <div
                            dangerouslySetInnerHTML={renderHtml(buildListHtml(listCards[currentListIndex].content))}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Indicadores de posición */}
                <div className="flex items-center justify-center gap-2">
                  {listCards.map((card, idx) => (
                    <button
                      key={`list-indicator-${card.id}`}
                      onClick={() => setCurrentListIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentListIndex
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Ir a lista ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Versión desktop: Grid de 2 columnas */}
            {!isMobile && (
              <div className="grid gap-6 lg:grid-cols-2">
                {listCards.map(card => (
                  <Card key={card.id} id={`${card.id}-card`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>{card.icon}</span>
                        <span>{card.title}</span>
                      </CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-mutedForeground prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={renderHtml(buildListHtml(card.content))} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {shouldShowSection('budget') && itinerary.budgetTiers.length > 0 && (
          <section id="budget" data-section="budget" className="space-y-6" style={{ order: getSectionOrder('budget') }}>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold">Presupuesto estimado</h2>
            <p className="text-mutedForeground">Valores de ejemplo para planificar y ajustar.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {itinerary.budgetTiers.map(tier => (
              <Card key={tier.label}>
                <CardHeader>
                  <CardTitle>{tier.label}</CardTitle>
                  <CardDescription>Estimación diaria por persona.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-semibold">€{tier.daily}</span>
                    <span className="text-sm text-mutedForeground">/ día</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-mutedForeground">
                    <span className={`h-2 w-2 rounded-full ${budgetToneClasses[tier.tone]}`} />
                    <span>Incluye alojamiento + comida + transporte local.</span>
                  </div>
                  <div className="text-sm text-mutedForeground">
                    Total aprox. viaje: €{tier.daily * totalDays}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        )}
      </main>
      </div>
    
    {/* Modals - Outside main layout */}
    {/* Main Map Modal */}
    <MapModal
      isOpen={isMapModalOpen}
      onClose={() => setIsMapModalOpen(false)}
      center={mapCenter}
      zoom={5}
      locations={itinerary.locations}
      routePositions={routePositions}
      title="Mapa del recorrido"
    />

    {/* Day Map Modal */}
    {dayMapModalData && (
      <MapModal
        isOpen={isDayMapModalOpen}
        onClose={() => {
          setIsDayMapModalOpen(false);
          setDayMapModalData(null);
        }}
        center={dayMapModalData.center}
        zoom={12}
        locations={dayMapModalData.points}
        routePositions={[]}
        title={`Mapa del día - ${dayMapModalData.points[0]?.city || 'Día'}`}
      />
    )}

    <DocumentPreviewModal
      open={Boolean(previewDocument)}
      onOpenChange={(open) => {
        if (!open) {
          setPreviewDocument(null);
        }
      }}
      title={previewDocument?.title ?? 'Documento'}
      url={previewDocument?.url ?? null}
    />
    </>
  );
}

export default ItineraryView;




