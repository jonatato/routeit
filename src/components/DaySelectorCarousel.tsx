import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { ItineraryDay } from '../data/itinerary';

const kindLabels: Record<string, string> = {
  flight: '\u2708\uFE0F Vuelo',
  travel: '\uD83D\uDE97 Traslado',
  city: '\uD83C\uDFD9\uFE0F Ciudad',
};

const kindIcons: Record<string, string> = {
  flight: '\u2708\uFE0F',
  travel: '\uD83D\uDE97',
  city: '\uD83C\uDFD9\uFE0F',
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startTime = useRef(0);

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

  // Manejo de gestos tactiles
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaTime = Date.now() - startTime.current;
    const velocity = Math.abs(dragOffset) / deltaTime;
    const threshold = 50; // px minimos para cambiar
    const velocityThreshold = 0.3; // px/ms para swipe rapido

    if (Math.abs(dragOffset) > threshold || velocity > velocityThreshold) {
      if (dragOffset > 0 && canGoPrev) {
        onDayChange(currentIndex - 1);
      } else if (dragOffset < 0 && canGoNext) {
        onDayChange(currentIndex + 1);
      }
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  // Manejo de mouse para desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startTime.current = Date.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX.current;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  const getTagColor = (kind: string): string | null => {
    if (!tagsCatalog) return null;
    const tag = tagsCatalog.find(t => t.slug === kind);
    return tag?.color ?? null;
  };

  const getTagLabel = (kind: string): string | null => {
    if (!tagsCatalog) return null;
    const tag = tagsCatalog.find(t => t.slug === kind);
    return tag?.name ?? null;
  };

  const getKindIcon = (kind: string): string => {
    const customLabel = getTagLabel(kind);
    if (customLabel) {
      // Extraer emoji si existe al inicio
      const emojiMatch = customLabel.match(/^(\p{Emoji})/u);
      if (emojiMatch) return emojiMatch[1];
    }
    return kindIcons[kind] || '\uD83D\uDCCD';
  };

  // Si no hay dia actual, no renderizar nada (despues de todos los hooks)
  if (!currentDay) {
    return null;
  };

  return (
    <div className="w-full min-w-0 space-y-3 overflow-hidden">
      {/* Selector principal */}
      <div className="flex w-full min-w-0 items-center gap-2">
        {/* Boton ir al inicio */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDayChange(0)}
          disabled={currentIndex === 0}
          className="hidden sm:flex h-10 w-10 shrink-0"
          title="Ir al primer dia"
        >
          <ChevronsLeft className="h-5 w-5" />
        </Button>

        {/* Boton anterior */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => canGoPrev && onDayChange(currentIndex - 1)}
          disabled={!canGoPrev}
          className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
          title="Dia anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Contenedor central con swipe y dropdown */}
        <div
          ref={containerRef}
          className="relative min-w-0 flex-1"
        >
          {/* Area de swipe */}
          <div
            className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            role="group"
            aria-label="Selector de dia con gesto de arrastre"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: isDragging ? `translateX(${dragOffset * 0.3}px)` : 'translateX(0)',
            }}
          >
            {/* Indicador de swipe */}
            {isDragging && Math.abs(dragOffset) > 30 && (
              <div className={`absolute inset-y-0 ${dragOffset > 0 ? 'left-0' : 'right-0'} w-12 bg-gradient-to-r ${
                dragOffset > 0 ? 'from-primary/20 to-transparent' : 'from-transparent to-primary/20'
              } flex items-center justify-center pointer-events-none z-10`}>
                {dragOffset > 0 ? (
                  <ChevronLeft className="h-6 w-6 text-primary animate-pulse" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-primary animate-pulse" />
                )}
              </div>
            )}

            {/* Contenido del dia actual */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                <span className="text-2xl shrink-0">{getKindIcon(currentDay.kind)}</span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                    <span className="min-w-0 truncate font-semibold text-foreground" title={currentDay.dayLabel}>
                      {trimText(currentDay.dayLabel, MAX_DAY_LABEL_LENGTH)}
                    </span>
                    {(() => {
                      const customColor = getTagColor(currentDay.kind);
                      const customLabel = getTagLabel(currentDay.kind);
                      return customColor ? (
                        <span 
                          className="inline-flex max-w-[7rem] shrink-0 items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: customColor }}
                        >
                          {customLabel}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="max-w-[7rem] shrink-0 truncate text-[10px]">
                          {kindLabels[currentDay.kind] || currentDay.kind}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="truncate text-sm text-muted-foreground" title={currentDay.city}>
                    {trimText(currentDay.city, MAX_CITY_LENGTH)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{currentDay.date}</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>
          </div>

          {/* Dropdown con lista de todos los dias */}
          {isDropdownOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              {days.map((day, index) => {
                const customColor = getTagColor(day.kind);
                const customLabel = getTagLabel(day.kind);
                const isActive = index === currentIndex;
                
                return (
                  <button
                    key={day.id}
                    onClick={() => {
                      onDayChange(index);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full min-w-0 items-center gap-3 border-b border-border/50 p-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${
                      isActive ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="text-lg shrink-0">{getKindIcon(day.kind)}</span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        <span
                          className={`min-w-0 truncate font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}
                          title={day.dayLabel}
                        >
                          {trimText(day.dayLabel, MAX_DAY_LABEL_LENGTH)}
                        </span>
                        {customColor ? (
                          <span 
                            className="inline-flex max-w-[6rem] shrink-0 items-center truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                            style={{ backgroundColor: customColor }}
                          >
                            {customLabel}
                          </span>
                        ) : (
                          <span className="max-w-[6rem] shrink-0 truncate text-[10px] text-muted-foreground">
                            {kindLabels[day.kind] || day.kind}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate" title={`${day.city} · ${day.date}`}>
                        {trimText(day.city, MAX_CITY_LENGTH)} · {day.date}
                      </p>
                    </div>
                    {isActive && (
                      <span className="text-xs text-primary font-medium shrink-0">Actual</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Boton siguiente */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => canGoNext && onDayChange(currentIndex + 1)}
          disabled={!canGoNext}
          className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
          title="Dia siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Boton ir al final */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDayChange(days.length - 1)}
          disabled={currentIndex === days.length - 1}
          className="hidden sm:flex h-10 w-10 shrink-0"
          title="Ir al ultimo dia"
        >
          <ChevronsRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Indicador de progreso */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">
          {currentIndex + 1} / {days.length}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / days.length) * 100}%` }}
          />
        </div>
        <div className="hidden sm:flex gap-1">
          {days.map((day, index) => {
            const isSpecial = day.kind === 'flight' || day.kind === 'travel';
            const isCurrent = index === currentIndex;
            return (
              <button
                key={day.id}
                onClick={() => onDayChange(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  isCurrent 
                    ? 'bg-primary scale-125' 
                    : isSpecial 
                      ? 'bg-accent hover:bg-accent/80' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                title={`${day.dayLabel} - ${day.city}`}
              />
            );
          })}
        </div>
      </div>

      {/* Acceso rapido movil */}
      <div className="flex sm:hidden justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDayChange(0)}
          disabled={currentIndex === 0}
          className="text-xs"
        >
          <ChevronsLeft className="h-4 w-4 mr-1" />
          Inicio
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDayChange(days.length - 1)}
          disabled={currentIndex === days.length - 1}
          className="text-xs"
        >
          Final
          <ChevronsRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

