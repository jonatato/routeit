import { useState } from 'react';
import { 
  Plane, 
  Calendar, 
  Copy, 
  Share2, 
  ChevronDown, 
  ChevronUp,
  Clock,
  MapPin,
  Check,
  Armchair,
  Ticket,
  Edit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Flight, FlightSegment } from '../data/itinerary';
import { Button } from './ui/button';

interface FlightCardProps {
  flight: Flight;
  editable?: boolean;
  onAddToCalendar?: (flight: Flight) => void;
}

const cabinClassLabels: Record<string, string> = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pending: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  delayed: { label: 'Retrasado', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

const directionLabels: Record<string, string> = {
  outbound: 'Ida',
  inbound: 'Vuelta',
  oneway: 'Solo ida',
  multi: 'Multi-ciudad',
};

function FlightSegmentCard({ segment, isLast }: { segment: FlightSegment; isLast: boolean }) {
  return (
    <div className="relative">
      {/* Segment content */}
      <div className="flex items-center gap-4 py-4">
        {/* Departure */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-2xl md:text-3xl font-bold text-foreground">{segment.departureTime}</p>
          <p className="text-lg font-semibold text-foreground">{segment.departureAirport}</p>
          <p className="text-sm text-mutedForeground">{segment.departureCity}</p>
          {segment.departureTerminal && (
            <p className="text-xs text-mutedForeground mt-1">Terminal {segment.departureTerminal}</p>
          )}
        </div>

        {/* Flight path visualization */}
        <div className="flex flex-col items-center gap-1 px-2 md:px-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="h-px w-12 md:w-20 bg-border relative">
              <Plane className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="text-xs text-mutedForeground">{segment.duration}</span>
          {segment.airline && segment.flightNumber && (
            <span className="text-xs font-medium text-foreground">
              {segment.airlineCode || segment.airline} {segment.flightNumber}
            </span>
          )}
        </div>

        {/* Arrival */}
        <div className="flex-1 text-center md:text-right">
          <p className="text-2xl md:text-3xl font-bold text-foreground">{segment.arrivalTime}</p>
          <p className="text-lg font-semibold text-foreground">{segment.arrivalAirport}</p>
          <p className="text-sm text-mutedForeground">{segment.arrivalCity}</p>
          {segment.arrivalTerminal && (
            <p className="text-xs text-mutedForeground mt-1">Terminal {segment.arrivalTerminal}</p>
          )}
        </div>
      </div>

      {/* Layover indicator */}
      {!isLast && (
        <div className="flex items-center justify-center gap-2 py-3 border-t border-dashed border-border">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-600 font-medium">Escala</span>
        </div>
      )}
    </div>
  );
}

export function FlightCard({ flight, editable = false, onAddToCalendar }: FlightCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const hasMultipleSegments = flight.segments.length > 1;
  const status = flight.status ? statusConfig[flight.status] : statusConfig.confirmed;
  const metaChipClass = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold';

  const handleCopyReference = async () => {
    if (!flight.bookingReference) return;
    try {
      await navigator.clipboard.writeText(flight.bookingReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Vuelo ${firstSegment?.departureCity} → ${lastSegment?.arrivalCity}`,
      text: `${flight.date}\n${firstSegment?.departureTime} - ${lastSegment?.arrivalTime}\n${flight.bookingReference ? `Ref: ${flight.bookingReference}` : ''}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
    }
  };

  if (!firstSegment || !lastSegment) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1 py-1">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-mutedForeground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedForeground">
              <Plane className="h-3.5 w-3.5" />
              {directionLabels[flight.direction]}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-mutedForeground">{flight.date}</span>
          </div>
          <h3 className="font-display text-[1.6rem] font-extrabold leading-none text-foreground">
            {flight.label || `${firstSegment.departureCity} → ${lastSegment.arrivalCity}`}
          </h3>
        </div>
        <div className={`shrink-0 ${metaChipClass} ${status.bg} ${status.color}`}>
          {flight.status === 'confirmed' && <Check className="h-3 w-3" />}
          {status.label}
        </div>
      </div>

      {!hasMultipleSegments ? (
        <FlightSegmentCard segment={firstSegment} isLast={true} />
      ) : (
        <>
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 text-center md:text-left">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{firstSegment.departureTime}</p>
              <p className="text-lg font-semibold text-foreground">{firstSegment.departureAirport}</p>
              <p className="text-sm text-mutedForeground">{firstSegment.departureCity}</p>
            </div>

            <div className="flex flex-col items-center gap-1 px-2 md:px-4">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="h-px w-6 bg-border" />
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <div className="h-px w-6 bg-border" />
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="text-xs text-mutedForeground">{flight.totalDuration || 'Total'}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedForeground">
                {flight.stops || flight.segments.length - 1} escala{(flight.stops || flight.segments.length - 1) > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex-1 text-center md:text-right">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{lastSegment.arrivalTime}</p>
              <p className="text-lg font-semibold text-foreground">{lastSegment.arrivalAirport}</p>
              <p className="text-sm text-mutedForeground">{lastSegment.arrivalCity}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-center gap-2 border-y border-dashed border-border/80 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar detalles de escalas
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver detalles de escalas
              </>
            )}
          </button>

          {showDetails && (
            <div className="space-y-0 pt-1">
              {flight.segments.map((segment, index) => (
                <FlightSegmentCard
                  key={segment.id}
                  segment={segment}
                  isLast={index === flight.segments.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border/80 pt-4">
        {flight.bookingReference && (
          <span className={`${metaChipClass} border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300`}>
            <Ticket className="h-3.5 w-3.5" />
            {flight.bookingReference}
          </span>
        )}
        {flight.seat && (
          <span className={`${metaChipClass} border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300`}>
            <Armchair className="h-3.5 w-3.5" />
            {flight.seat}
          </span>
        )}
        {flight.cabinClass && (
          <span className={`${metaChipClass} border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300`}>
            <MapPin className="h-3.5 w-3.5" />
            {cabinClassLabels[flight.cabinClass]}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border/80 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onAddToCalendar?.(flight)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendario
        </Button>

        {flight.bookingReference && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={handleCopyReference}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar ref.
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
        </Button>

        {editable && (
          <Link to={`/app/admin?section=flights&id=${flight.id}`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default FlightCard;
