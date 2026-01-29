import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ItineraryLocation } from '../../data/itinerary';

interface LocationsMapWidgetProps {
  locations: ItineraryLocation[];
  onViewFullMap?: () => void;
}

export function LocationsMapWidget({ locations, onViewFullMap }: LocationsMapWidgetProps) {
  // Calculate total distance (simplified - in reality would use proper distance calculation)
  const calculateTotalDistance = () => {
    if (locations.length < 2) return 0;
    
    // Mock calculation - in production, use proper geo distance formula
    return locations.length * 500; // km between cities
  };

  const totalDistance = calculateTotalDistance();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">📍</span>
          Mapa de Ubicaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Placeholder */}
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20">
          {/* Simple visual representation */}
          <div className="flex h-full items-center justify-center p-4">
            <div className="relative w-full">
              {locations.slice(0, 5).map((location, idx) => (
                <div
                  key={idx}
                  className="group absolute flex items-center gap-2"
                  style={{
                    left: `${15 + idx * 18}%`,
                    top: `${25 + (idx % 2) * 30}%`,
                  }}
                >
                  {/* Pin */}
                  <div className="relative">
                    <MapPin className="h-6 w-6 fill-red-500 text-red-600 drop-shadow-lg transition-transform group-hover:scale-110" />
                    {/* Tooltip */}
                    <div className="absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-100 dark:text-gray-900">
                      {location.label}
                    </div>
                  </div>
                  
                  {/* Connection line to next location */}
                  {idx < locations.length - 1 && (
                    <div className="h-0.5 w-8 bg-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Overlay Badge */}
          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur-sm dark:bg-gray-900/90">
            <Navigation className="mr-1 inline h-3 w-3" />
            {locations.length} ubicaciones
          </div>
        </div>

        {/* Locations List */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Ubicaciones:</div>
            <div className="flex flex-wrap gap-2">
              {locations.slice(0, 5).map((location, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                >
                  <MapPin className="h-3 w-3" />
                  {location.label}
                </div>
              ))}
              {locations.length > 5 && (
                <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  +{locations.length - 5} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {locations.length} {locations.length === 1 ? 'ciudad' : 'ciudades'}
              </span>
            </div>
            {totalDistance > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-4 w-4" />
                <span className="font-semibold">{totalDistance.toLocaleString()} km</span>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {locations.length === 0 && (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">🗺️</div>
            <div className="text-sm text-muted-foreground">
              No hay ubicaciones añadidas
            </div>
          </div>
        )}

        {/* View Full Map Button */}
        {locations.length > 0 && onViewFullMap && (
          <button
            onClick={onViewFullMap}
            className="flex w-full items-center justify-center gap-1 text-sm text-primary transition-colors hover:underline"
          >
            Ver mapa completo
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
