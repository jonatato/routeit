import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, MapPinned, Plane, Route, type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import type { ItineraryDay } from '../data/itinerary';

const kindMeta: Record<string, { label: string; Icon: LucideIcon }> = {
  flight: { label: 'Vuelo', Icon: Plane },
  travel: { label: 'Traslado', Icon: Route },
  city: { label: 'Ciudad', Icon: MapPinned },
};

interface DaySelectorCarouselProps {
  days: ItineraryDay[];
  currentIndex: number;
  onDayChange: (index: number) => void;
  tagsCatalog?: Array<{ name: string; slug: string; color?: string }>;
}

const MAX_DAY_LABEL_LENGTH = 24;
const MAX_CITY_LENGTH = 52;

const trimText = (value: string, maxLength: number) => {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
};

export function DaySelectorCarousel({ 
  days, 
  currentIndex, 
  onDayChange,
  tagsCatalog 
}: DaySelectorCarouselProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const startX = useRef(0);
  const startTime = useRef(0);
  const shouldBlockToggleRef = useRef(false);

  const currentDay = days[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < days.length - 1;

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const updateDropdownRect = () => {
      if (!containerRef.current) return;
      setDropdownRect(containerRef.current.getBoundingClientRect());
    };

    const handleAnyScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && dropdownRef.current?.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
    };

    updateDropdownRect();
    window.addEventListener('resize', updateDropdownRect);
    document.addEventListener('scroll', handleAnyScroll, true);

    return () => {
      window.removeEventListener('resize', updateDropdownRect);
      document.removeEventListener('scroll', handleAnyScroll, true);
    };
  }, [isDropdownOpen]);

  // Gestos tactiles compactos para movil
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const deltaTime = Math.max(Date.now() - startTime.current, 1);
    const velocity = Math.abs(swipeOffset) / deltaTime;
    const threshold = 56;
    const velocityThreshold = 0.28;
    let didNavigate = false;

    if (Math.abs(swipeOffset) > threshold || velocity > velocityThreshold) {
      if (swipeOffset > 0 && canGoPrev) {
        onDayChange(currentIndex - 1);
        didNavigate = true;
      } else if (swipeOffset < 0 && canGoNext) {
        onDayChange(currentIndex + 1);
        didNavigate = true;
      }
    }

    if (didNavigate) {
      shouldBlockToggleRef.current = true;
    }

    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const getTagLabel = (kind: string): string | null => {
    if (!tagsCatalog) return null;
    const tag = tagsCatalog.find(t => t.slug === kind);
    return tag?.name ?? null;
  };

  const getKindIcon = (kind: string): LucideIcon => {
    return kindMeta[kind]?.Icon ?? MapPinned;
  };

  const getKindLabel = (kind: string) => getTagLabel(kind) ?? kindMeta[kind]?.label ?? 'Parada';

  // Si no hay dia actual, no renderizar nada (despues de todos los hooks)
  if (!currentDay) {
    return null;
  };

  return (
    <div className="w-full min-w-0 space-y-3 overflow-hidden">
      <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => canGoPrev && onDayChange(currentIndex - 1)}
          disabled={!canGoPrev}
          className="h-11 w-11 shrink-0 rounded-full border-border/70 bg-card/80 !p-0 shadow-none"
          title="Dia anterior"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </Button>

        <div
          ref={containerRef}
          className="relative min-w-0 flex-1"
        >
          <div
            className="relative overflow-hidden rounded-[1.2rem] border border-border/70 bg-card/90 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-transform"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: isSwiping ? `translateX(${Math.max(Math.min(swipeOffset * 0.15, 10), -10)}px)` : 'translateX(0)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (shouldBlockToggleRef.current) {
                  shouldBlockToggleRef.current = false;
                  return;
                }
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden px-4 py-2.5 text-left transition-colors hover:bg-muted/15"
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Día {String(currentIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-[11px] font-medium">{currentDay.date}</span>
                  <span className="truncate text-[11px] text-muted-foreground/90">{getKindLabel(currentDay.kind)}</span>
                </div>
                <div className="mt-1.5 min-w-0">
                  <p className="truncate font-display text-[1.05rem] font-extrabold leading-none text-foreground sm:text-[1.15rem]" title={currentDay.city || currentDay.dayLabel}>
                    {trimText(currentDay.city || currentDay.dayLabel, MAX_CITY_LENGTH)}
                  </p>
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden">
                  <p className="min-w-0 truncate text-xs text-muted-foreground" title={currentDay.dayLabel}>
                    {trimText(currentDay.dayLabel, MAX_DAY_LABEL_LENGTH)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {currentIndex + 1} / {days.length}
                </span>
                <ChevronDown className={`h-4.5 w-4.5 text-muted-foreground transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </button>
          </div>

          {isDropdownOpen && dropdownRect && (
            <div
              ref={dropdownRef}
              className="fixed z-50 max-h-72 overflow-y-auto rounded-[1.1rem] border border-border/70 bg-card shadow-[0_14px_34px_rgba(15,23,42,0.12)]"
              style={{
                top: dropdownRect.bottom + 8,
                left: dropdownRect.left,
                width: dropdownRect.width,
                maxHeight: '40vh',
              }}
            >
              {days.map((day, index) => {
                const Icon = getKindIcon(day.kind);
                const isActive = index === currentIndex;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      onDayChange(index);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full min-w-0 items-center gap-3 border-b border-border/40 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/20 ${
                      isActive ? 'bg-primary/8' : ''
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      isActive ? 'border-primary/25 bg-primary/8 text-primary' : 'border-border/50 bg-muted/25 text-muted-foreground'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          Día {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`truncate font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {trimText(day.city || day.dayLabel, 28)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={`${day.date} · ${getKindLabel(day.kind)}`}>
                        {day.date} · {getKindLabel(day.kind)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => canGoNext && onDayChange(currentIndex + 1)}
          disabled={!canGoNext}
          className="h-11 w-11 shrink-0 rounded-full border-border/70 bg-card/80 !p-0 shadow-none"
          title="Dia siguiente"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </Button>
      </div>
    </div>
  );
}

