import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';

type Location = {
  city: string;
  lat: number;
  lng: number;
  label: string;
  region: string;
};

type MapModalProps = {
  isOpen: boolean;
  onClose: () => void;
  center: [number, number];
  zoom: number;
  locations: Location[];
  routePositions: [number, number][];
  title?: string;
};

export function MapModal({
  isOpen,
  onClose,
  center,
  zoom,
  locations,
  routePositions,
  title = 'Mapa del viaje',
}: MapModalProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mapRef.current) {
      // Force map to recalculate its size after opening
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isOpen]);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[10000] flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden md:flex"
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="h-full w-full pt-[57px]">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routePositions.length > 0 && (
            <Polyline positions={routePositions} pathOptions={{ color: '#9b87f5', weight: 3 }} />
          )}
          {locations.map(location => (
            <Marker key={location.city} position={[location.lat, location.lng]}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {location.label}
              </Tooltip>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{location.city}</p>
                  <p className="text-xs text-muted-foreground">{location.region}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
