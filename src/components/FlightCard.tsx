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
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

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
    <Card className="overflow-hidden border-2 border-border/60 shadow-lg">
      {/* Header - Boarding pass style */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">{directionLabels[flight.direction]}</p>
              <p className="text-lg font-bold">
                {flight.label || `${firstSegment.departureCity} → ${lastSegment.arrivalCity}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Fecha</p>
            <p className="text-lg font-bold">{flight.date}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Main flight info */}
        <div className="p-4 md:p-6">
          {/* Simple view: first and last segment summary */}
          {!hasMultipleSegments ? (
            <FlightSegmentCard segment={firstSegment} isLast={true} />
          ) : (
            <>
              {/* Multi-segment summary */}
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
                  <Badge variant="secondary" className="text-xs">
                    {flight.stops || flight.segments.length - 1} escala{(flight.stops || flight.segments.length - 1) > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="flex-1 text-center md:text-right">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{lastSegment.arrivalTime}</p>
                  <p className="text-lg font-semibold text-foreground">{lastSegment.arrivalAirport}</p>
                  <p className="text-sm text-mutedForeground">{lastSegment.arrivalCity}</p>
                </div>
              </div>

              {/* Expandable segments */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-center gap-2 border-t border-dashed border-border py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
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
                <div className="border-t border-border bg-muted/30 px-4 py-2">
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
        </div>

        {/* Ticket details section */}
        <div className="border-t border-dashed border-border bg-muted/30 px-4 py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {flight.bookingReference && (
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-mutedForeground" />
                <div>
                  <p className="text-xs text-mutedForeground">Referencia</p>
                  <p className="font-mono font-semibold text-foreground">{flight.bookingReference}</p>
                </div>
              </div>
            )}
            {flight.seat && (
              <div className="flex items-center gap-2">
                <Armchair className="h-4 w-4 text-mutedForeground" />
                <div>
                  <p className="text-xs text-mutedForeground">Asiento</p>
                  <p className="font-semibold text-foreground">{flight.seat}</p>
                </div>
              </div>
            )}
            {flight.cabinClass && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-mutedForeground" />
                <div>
                  <p className="text-xs text-mutedForeground">Clase</p>
                  <p className="font-semibold text-foreground">{cabinClassLabels[flight.cabinClass]}</p>
                </div>
              </div>
            )}
            {flight.status && (
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
                  {flight.status === 'confirmed' && <Check className="h-3 w-3" />}
                  {status.label}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-background p-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onAddToCalendar?.(flight)}
          >
            <Calendar className="h-4 w-4 mr-2" />
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
                  <Check className="h-4 w-4 mr-2 text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
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
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>

          {editable && (
            <Link to={`/app/admin?section=flights&id=${flight.id}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FlightCard;
