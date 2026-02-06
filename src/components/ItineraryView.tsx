import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Plus, Settings, Search, Maximize2 } from 'lucide-react';
import type { TravelItinerary, Flight, FlightSegment } from '../data/itinerary';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { PandaLogo } from './PandaLogo';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs as UITabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DaySelectorCarousel } from './DaySelectorCarousel';
import { FlightCarousel } from './FlightCarousel';
import { fetchSectionPreferences, type SectionPreference } from '../services/sections';
import { supabase } from '../lib/supabase';
import { exportItineraryToPDF } from '../services/pdfExport';
import { PDFExportDialog } from './PDFExportDialog';
import { MapModal } from './MapModal';
import { useIsMobileShell } from '../hooks/useIsMobileShell';
import { downloadFlightICS } from '../utils/calendarExport';

const kindLabels: Record<string, string> = {
  flight: '✈️ Vuelo',
  travel: '🚗 Traslado',
  city: '🏙️ Ciudad',
};

const kindVariants: Record<string, 'secondary' | 'accent' | 'primary'> = {
  flight: 'secondary',
  travel: 'accent',
  city: 'primary',
};

const budgetToneClasses = {
  secondary: 'bg-secondary',
  primary: 'bg-primary',
  accent: 'bg-accent',
} as const;

// Helper para obtener color de etiqueta del catálogo
function getTagColor(kind: string, tagsCatalog?: Array<{ name: string; slug: string; color?: string }>): string | null {
  if (!tagsCatalog) return null;
  const tag = tagsCatalog.find(t => t.slug === kind);
  return tag?.color ?? null;
}

// Helper para obtener label de etiqueta del catálogo
function getTagLabel(kind: string, tagsCatalog?: Array<{ name: string; slug: string; color?: string }>): string | null {
  if (!tagsCatalog) return null;
  const tag = tagsCatalog.find(t => t.slug === kind);
  return tag?.name ?? null;
}

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
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [activeTabValue, setActiveTabValue] = useState('0');
  const isMobile = useIsMobileShell();
  const [sectionPreferences, setSectionPreferences] = useState<SectionPreference[]>([]);
  const [sliderHeight, setSliderHeight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showAllMarkers, setShowAllMarkers] = useState(true);
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
  const visibleLocations = useMemo(() => {
    if (showAllMarkers) return itinerary.locations;
    if (!hoveredCity) return [];
    return itinerary.locations.filter(location => location.city === hoveredCity);
  }, [hoveredCity, showAllMarkers, itinerary.locations]);
  const routePositions = useMemo(() => {
    const map = new Map(itinerary.locations.map(loc => [loc.city, loc]));
    return itinerary.route
      .map(city => map.get(city))
      .filter(Boolean)
      .map(loc => [loc!.lat, loc!.lng] as [number, number]);
  }, [itinerary.locations, itinerary.route]);
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
  const todayIndex = useMemo(() => {
    const today = new Date();
    if (Number.isNaN(today.getTime())) return null;
    const matchIndex = filteredDays.findIndex(day => {
      const parsed = Date.parse(day.date);
      if (Number.isNaN(parsed)) return false;
      const dayDate = new Date(parsed);
      return (
        dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getDate() === today.getDate()
      );
    });
    return matchIndex >= 0 ? matchIndex : null;
  }, [filteredDays]);
  const currentDay = filteredDays[currentDayIndex];
  const currentDayLocation = useMemo(() => {
    if (!currentDay) return null;
    const segments = currentDay.city.split('→').map(part => part.trim()).reverse();
    for (const segment of segments) {
      const match = itinerary.locations.find(location =>
        segment.includes(location.city) || location.city.includes(segment),
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

    const priority = isMobile
      ? ['flights', 'itinerary', 'flightInfo', 'overview', 'map', 'foods', 'budget']
      : ['flights', 'itinerary', 'flightInfo', 'overview', 'map', 'foods', 'budget'];
    priority.forEach((key, index) => {
      const current = config.get(key);
      config.set(key, { visible: current?.visible ?? true, order: index });
    });

    return config;
  }, [isMobile, sectionPreferences]);

  const shouldShowSection = (key: string) => {
    const config = sectionConfig.get(key);
    return config ? config.visible : true;
  };

  const getSectionOrder = (key: string) => {
    const config = sectionConfig.get(key);
    return config ? config.order : 999;
  };

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
    const stored = localStorage.getItem('routeit-checklist');
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
  }, []);

  useEffect(() => {
    localStorage.setItem('routeit-checklist', JSON.stringify(checkedItems));
  }, [checkedItems]);

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
    const section = mapSectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsMapVisible(true);
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const itineraryContainerRef = useRef<HTMLDivElement | null>(null);

  const handlePDFExport = async (options: import('../services/pdfExport').PDFExportOptions) => {
    if (!itineraryContainerRef.current) {
      throw new Error('No se pudo encontrar el contenedor del itinerario');
    }
    await exportItineraryToPDF(itinerary, itineraryContainerRef.current, options);
  };

  const handlePrint = () => {
    setShowPDFDialog(true);
  };

  return (
    <>
      {showPDFDialog && (
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
        <section data-section="flights" className="grid gap-6" style={{ order: getSectionOrder('flights') }}>
          {itinerary.coverImage && (
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
            <div className="flex flex-wrap gap-3">
              <Button  className="rounded-full no-print" onClick={handlePrint}>
                Exportar PDF
              </Button>
            </div>
          </div>

          {shouldShowSection('overview') && (
            <Card className="mt-2 bg-gradient-to-br from-white to-muted hidden lg:block">
              <CardHeader>
                <CardTitle>Resumen rápido</CardTitle>
                <CardDescription>Todo lo esencial a un vistazo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm text-mutedForeground">Total de días</p>
                  <p className="text-3xl font-semibold">{totalDays}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm text-mutedForeground">Ciudades</p>
                  <p className="text-3xl font-semibold">{itinerary.locations.length}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm text-mutedForeground">Traslados</p>
                  <p className="text-3xl font-semibold">{travelCount}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm text-mutedForeground">Vuelos</p>
                  <p className="text-3xl font-semibold">
                    {itinerary.days.filter(day => day.kind === 'flight').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {flightsList.length > 0 && (
          <section className="space-y-6" style={{ order: getSectionOrder('flightInfo') }}>
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold">Información de vuelos</h2>
              <p className="text-mutedForeground">
                {flightsList.length === 1 
                  ? 'Detalles de tu vuelo.' 
                  : `${flightsList.length} vuelos configurados. Desliza para ver todos.`
                }
              </p>
            </div>
            <FlightCarousel
              flights={flightsList}
              editable={editable}
              onAddToCalendar={downloadFlightICS}
            />
          </section>
        )}

        {shouldShowSection('map') && (
          <section id="map" data-section="map" className="space-y-6" ref={mapSectionRef} style={{ order: getSectionOrder('map') }}>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold">Mapa interactivo</h2>
            <p className="text-mutedForeground">Pins por ciudad y ruta general del viaje.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <CardHeader>
                <CardTitle>Ciudades del recorrido</CardTitle>
                <CardDescription>Hover o foco para destacar; usa el botón para centrar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                  <span className="font-medium">Mostrar todos los pins</span>
                  <button
                    type="button"
                    className={`relative h-6 w-11 rounded-full border transition ${
                      showAllMarkers ? 'border-primary bg-primary' : 'border-border bg-muted'
                    }`}
                    onClick={() => setShowAllMarkers(value => !value)}
                    aria-pressed={showAllMarkers}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        showAllMarkers ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!currentDayLocation) return;
                    mapRef.current?.setView([currentDayLocation.lat, currentDayLocation.lng], 7);
                  }}
                  disabled={!currentDayLocation}
                  className="w-full"
                >
                  Centrar en día actual
                </Button>
                {itinerary.locations.map(location => {
                  const isActive = hoveredCity === location.city;
                  return (
                    <button
                      key={location.city}
                      type="button"
                      onMouseEnter={() => setHoveredCity(location.city)}
                      onMouseLeave={() => setHoveredCity(null)}
                      onFocus={() => setHoveredCity(location.city)}
                      onBlur={() => setHoveredCity(null)}
                      onClick={() => {
                        // Centrar el mapa en la ciudad seleccionada
                        mapRef.current?.setView([location.lat, location.lng], 9);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-primary/5 hover:border-primary/30'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span className="font-medium">{location.city}</span>
                      <span className="text-xs text-mutedForeground">{location.label}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="relative z-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative z-0 h-[420px] w-full cursor-pointer group" onClick={() => setIsMapModalOpen(true)}>
                  {isMapVisible && (
                    <>
                      <MapContainer center={mapCenter} zoom={5} className="h-full w-full" ref={mapRef}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Polyline positions={routePositions} pathOptions={{ color: '#2563eb', weight: 3 }} />
                        {visibleLocations.map(location => (
                          <Marker key={location.city} position={[location.lat, location.lng]}>
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                              {location.label}
                            </Tooltip>
                            <Popup>{location.label}</Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
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

        {shouldShowSection('itinerary') && (
          <section id="itinerary" data-section="itinerary" className="space-y-4" style={{ order: getSectionOrder('itinerary') }}>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold md:text-3xl">Itinerario</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar actividad, lugar..."
                  className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 pl-10"
                  aria-label="Buscar en el itinerario"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {editable && (
                <Link to="/app/admin?section=days">
                  <Button size="sm" className="rounded-full whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo día
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
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
              
              {/* Contenido del día seleccionado */}
              {filteredDays[currentDayIndex] && (() => {
                const day = filteredDays[currentDayIndex];
                const customColor = getTagColor(day.kind, tagsCatalog);
                const customLabel = getTagLabel(day.kind, tagsCatalog);
                return (
                  <>
                    <Card className="w-full border border-border/60 shadow-sm">
                      <CardHeader className="gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {customColor ? (
                          <span 
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: customColor }}
                          >
                            {customLabel ?? day.kind}
                          </span>
                        ) : (
                          <Badge variant={kindVariants[day.kind] ?? 'primary'}>{kindLabels[day.kind] ?? day.kind}</Badge>
                        )}
                        <Badge variant="secondary">{day.dayLabel}</Badge>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                          {day.date}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{day.city}</CardTitle>
                      <CardDescription>{day.plan}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Timeline de actividades */}
                      <div className="relative space-y-5">
                        <div className="absolute left-3 top-2 h-[calc(100%-20px)] w-px bg-border" />
                        {day.schedule.map((item, itemIndex) => {
                          const checked = checkedItems.includes(`${day.id}-${itemIndex}`);
                          return (
                            <div
                              key={`${day.id}-${item.time || 'no-time'}-${itemIndex}`}
                              className={`relative flex flex-col gap-2 pl-8 text-sm transition ${
                                checked ? 'opacity-50' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const key = `${day.id}-${itemIndex}`;
                                  setCheckedItems(prev =>
                                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
                                  );
                                }}
                                className={`absolute left-0.5 top-1.5 h-5 w-5 rounded-full border-2 transition ${
                                  checked
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border bg-background hover:border-primary/50'
                                }`}
                                aria-label={checked ? 'Marcar como pendiente' : 'Marcar como completado'}
                              >
                                {checked && (
                                  <svg viewBox="0 0 24 24" className="h-full w-full p-0.5" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M5 12l5 5L20 7" />
                                  </svg>
                                )}
                              </button>
                              <span className="font-semibold text-foreground">{item.time}</span>
                              <div className="flex flex-col gap-1 text-mutedForeground">
                                <span className={checked ? 'line-through' : ''}>{item.activity}</span>
                                <div className="flex flex-wrap gap-2">
                                  {item.link && (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                                    >
                                      Entradas
                                    </a>
                                  )}
                                  {item.mapLink && (
                                    <a
                                      href={item.mapLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                      Maps
                                    </a>
                                  )}
                                  {item.cost && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                      €{item.cost.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Notas y estadísticas */}
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                            Notas clave
                          </p>
                          {day.notes.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-mutedForeground">
                              {day.notes.map(note => (
                                <span key={note} className="rounded-full border border-border px-3 py-1">
                                  {note}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-mutedForeground">Sin notas adicionales.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {shouldShowDayMap && (
                    <div
                      className="overflow-hidden rounded-xl border border-border cursor-pointer group relative"
                      onClick={() => {
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
                    >
                      <div className="h-64 w-full">
                        <MapContainer center={dayMapCenter} zoom={12} className="h-full w-full">
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
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
                const customColor = getTagColor(day.kind, tagsCatalog);
                const customLabel = getTagLabel(day.kind, tagsCatalog);
                
                return (
                  <div key={day.id} className="mt-4 space-y-4">
                    {/* Info del día */}
                    <Card>
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          {customColor ? (
                            <span 
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: customColor }}
                            >
                              {customLabel ?? day.kind}
                            </span>
                          ) : (
                            <Badge variant={kindVariants[day.kind] ?? 'primary'}>{kindLabels[day.kind] ?? day.kind}</Badge>
                          )}
                          <Badge variant="secondary">{day.dayLabel}</Badge>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                            {day.date}
                          </span>
                        </div>
                        <CardTitle>{day.city}</CardTitle>
                        <CardDescription>{day.plan}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Timeline de actividades */}
                        <div className="relative space-y-4">
                          <div className="absolute left-3 top-2 h-[calc(100%-16px)] w-px bg-border" />
                          {day.schedule.map((item, itemIndex) => {
                            const checked = checkedItems.includes(`${day.id}-${itemIndex}`);
                            return (
                              <div
                                key={`${day.id}-${item.time || 'no-time'}-${itemIndex}`}
                                className={`relative flex flex-col gap-2 pl-8 text-sm transition ${
                                  checked ? 'opacity-50' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const key = `${day.id}-${itemIndex}`;
                                    setCheckedItems(prev =>
                                      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
                                    );
                                  }}
                                  className={`absolute left-0.5 top-1.5 h-5 w-5 rounded-full border-2 transition ${
                                    checked
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-border bg-background hover:border-primary/50'
                                  }`}
                                  aria-label={checked ? 'Marcar como pendiente' : 'Marcar como completado'}
                                >
                                  {checked && (
                                    <svg viewBox="0 0 24 24" className="h-full w-full p-0.5" fill="none" stroke="currentColor" strokeWidth="3">
                                      <path d="M5 12l5 5L20 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className="w-auto font-semibold text-foreground">{item.time}</span>
                                <div className="flex flex-col gap-1 text-mutedForeground">
                                  <span className={checked ? 'line-through' : ''}>{item.activity}</span>
                                  <div className="flex flex-wrap gap-2">
                                    {item.link && (
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary transition active:bg-primary/30"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
                                          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L14 19" />
                                        </svg>
                                        Entradas
                                      </a>
                                    )}
                                    {item.mapLink && (
                                      <a
                                        href={item.mapLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition active:bg-emerald-200"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 6l8-3 10 4-8 3-10-4z" />
                                          <path d="M14 10l7-3v11l-7 3" />
                                          <path d="M3 6v11l8 3" />
                                        </svg>
                                        Maps
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    {dayPoints.length > 0 && (
                      <div 
                        className="overflow-hidden rounded-xl border border-border cursor-pointer group relative" 
                        onClick={() => {
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
                        <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
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

        {shouldShowSection('overview') && (
          <section id="overview" data-section="overview" className="grid gap-6 lg:grid-cols-[2fr_1fr]" style={{ order: getSectionOrder('overview') }}>
          <Card>
            <CardHeader>
              <CardTitle>Checklist previa</CardTitle>
              <CardDescription>Imprescindibles antes de salir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-mutedForeground">
                <span>{checklistProgress}% completado</span>
                <span>
                  {checkedItems.length}/{checklistItems.length}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <div className="grid gap-3 text-sm text-mutedForeground md:grid-cols-2">
                {checklistItems.map((item, index) => {
                  const checked = checkedItems.includes(item);
                  return (
                    <label
                      key={`check-${index}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 transition ${
                        checked ? 'bg-muted text-foreground' : 'bg-background'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setCheckedItems(prev =>
                            prev.includes(item) ? prev.filter(value => value !== item) : [...prev, item],
                          );
                        }}
                      />
                      <span dangerouslySetInnerHTML={renderHtml(item)} />
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Notas clave</CardTitle>
              <CardDescription>Consejos rápidos de seguridad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-mutedForeground">
              <p>Pasaporte siempre contigo + copia digital.</p>
              <p>Powerbank y adaptador universal cada día.</p>
              <p>Evita horas pico en atracciones populares.</p>
            </CardContent>
          </Card>
        </section>
        )}

        {shouldShowSection('foods') && (
          <section id="foods" data-section="lists" className="space-y-6" style={{ order: getSectionOrder('foods') }}>
            {/* Header de la sección */}
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold">Listas principales</h2>
              <p className="text-mutedForeground">Un elemento por línea.</p>
            </div>

            {/* Versión móvil: Carousel horizontal */}
            {isMobile && listCards.length > 0 && (
              <div className="space-y-4">
                {/* Navegación de pestañas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {listCards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => setCurrentListIndex(idx)}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        idx === currentListIndex
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                  {listCards.map((_, idx) => (
                    <button
                      key={idx}
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

      <footer className="border-t border-border bg-muted">
        <div className="mx-auto flex w-full  flex-col gap-2 px-4 py-6 text-sm text-mutedForeground md:flex-row md:items-center md:justify-between">
          <span>
            Route<span className="text-primary">it</span> · Mi Itinerario
          </span>
          <span>Diseñado para móvil y escritorio</span>
        </div>
      </footer>
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
    </>
  );
}

export default ItineraryView;

