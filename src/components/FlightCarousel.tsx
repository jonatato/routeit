import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plane } from 'lucide-react';
import type { Flight } from '../data/itinerary';
import { FlightCard } from './FlightCard';
import { Button } from './ui/button';

interface FlightCarouselProps {
  flights: Flight[];
  editable?: boolean;
  onAddToCalendar?: (flight: Flight) => void;
}

const directionLabels: Record<string, string> = {
  outbound: 'Ida',
  inbound: 'Vuelta',
  oneway: 'Solo ida',
  multi: 'Multi-ciudad',
};

export function FlightCarousel({ flights, editable = false, onAddToCalendar }: FlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Touch/swipe handling
  const swipeState = useRef({ startX: 0, deltaX: 0, isDragging: false });

  const goToFlight = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(index, flights.length - 1));
    setCurrentIndex(newIndex);
    setIsDropdownOpen(false);
  }, [flights.length]);

  const goToPrevious = useCallback(() => {
    goToFlight(currentIndex - 1);
  }, [currentIndex, goToFlight]);

  const goToNext = useCallback(() => {
    goToFlight(currentIndex + 1);
  }, [currentIndex, goToFlight]);

  // Handle touch events for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeState.current.startX = e.touches[0].clientX;
    swipeState.current.isDragging = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.current.isDragging) return;
    swipeState.current.deltaX = e.touches[0].clientX - swipeState.current.startX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.current.isDragging) return;
    const threshold = 50;
    if (swipeState.current.deltaX > threshold) {
      goToPrevious();
    } else if (swipeState.current.deltaX < -threshold) {
      goToNext();
    }
    swipeState.current = { startX: 0, deltaX: 0, isDragging: false };
  }, [goToPrevious, goToNext]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (flights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <Plane className="mx-auto h-12 w-12 text-mutedForeground/50" />
        <p className="mt-4 text-mutedForeground">No hay vuelos configurados</p>
      </div>
    );
  }

  const currentFlight = flights[currentIndex];
  const firstSegment = currentFlight?.segments[0];
  const lastSegment = currentFlight?.segments[currentFlight.segments.length - 1];

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      {flights.length > 1 && (
        <div className="flex items-center justify-between gap-4">
          {/* Previous button */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="shrink-0"
            aria-label="Vuelo anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Dropdown selector */}
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-left transition hover:bg-muted/50"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {currentFlight?.label || `${firstSegment?.departureCity} → ${lastSegment?.arrivalCity}`}
                  </p>
                  <p className="text-xs text-mutedForeground">
                    {directionLabels[currentFlight?.direction || 'outbound']} · {currentFlight?.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-mutedForeground">
                  {currentIndex + 1} / {flights.length}
                </span>
                <ChevronDown className={`h-4 w-4 text-mutedForeground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-background shadow-lg">
                {flights.map((flight, index) => {
                  const fFirst = flight.segments[0];
                  const fLast = flight.segments[flight.segments.length - 1];
                  const isSelected = index === currentIndex;
                  return (
                    <button
                      key={flight.id}
                      type="button"
                      onClick={() => goToFlight(index)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isSelected ? 'bg-primary text-white' : 'bg-muted text-mutedForeground'
                      }`}>
                        <Plane className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {flight.label || `${fFirst?.departureCity} → ${fLast?.arrivalCity}`}
                        </p>
                        <p className="text-xs text-mutedForeground">
                          {directionLabels[flight.direction]} · {flight.date}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === flights.length - 1}
            className="shrink-0"
            aria-label="Vuelo siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Flight card with swipe */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        {currentFlight && (
          <FlightCard
            flight={currentFlight}
            editable={editable}
            onAddToCalendar={onAddToCalendar}
          />
        )}
      </div>

      {/* Progress dots */}
      {flights.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {flights.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToFlight(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'bg-border hover:bg-primary/50'
              }`}
              aria-label={`Ir al vuelo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FlightCarousel;
