import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { ScheduleItem } from '../data/itinerary';
import { MapPin } from 'lucide-react';
import { resolveMapsUrl } from '../services/maps';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem;
  onSave: (item: ScheduleItem) => void;
}

export function ActivityEditModal({
  isOpen,
  onClose,
  item,
  onSave,
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState<ScheduleItem>(item);
  const [isResolvingMap, setIsResolvingMap] = useState(false);

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
      if (!match) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
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

  const resolveCoordinates = async (base: ScheduleItem) => {
    const raw = (base.mapLink ?? '').trim();
    if (!raw) {
      return {
        ...base,
        mapLink: '',
        lat: undefined,
        lng: undefined,
      };
    }

    const parsed = parseGoogleMapsCoords(raw);
    if (parsed) {
      return {
        ...base,
        mapLink: raw,
        lat: parsed.lat,
        lng: parsed.lng,
      };
    }

    if (!isGoogleMapsUrl(raw)) {
      return {
        ...base,
        mapLink: raw,
      };
    }

    setIsResolvingMap(true);
    try {
      const resolved = await resolveMapsUrl(raw);
      return {
        ...base,
        mapLink: resolved?.url ?? raw,
        lat: resolved?.lat ?? base.lat,
        lng: resolved?.lng ?? base.lng,
      };
    } finally {
      setIsResolvingMap(false);
    }
  };

  const handleSave = async () => {
    const withCoords = await resolveCoordinates(formData);
    onSave(withCoords);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar actividad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="activity-edit-time" className="text-sm font-medium">Hora</label>
            <input
              id="activity-edit-time"
              type="time"
              value={formData.time || ''}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="activity-edit-name" className="text-sm font-medium">Actividad</label>
            <input
              id="activity-edit-name"
              value={formData.activity || ''}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              placeholder="Ej: Visitar la Gran Muralla"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="activity-edit-link" className="text-sm font-medium">Enlace</label>
            <input
              id="activity-edit-link"
              value={formData.link || ''}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="activity-edit-map" className="text-sm font-medium">Ubicación en Maps</label>
            <div className="flex gap-2">
              <input
                id="activity-edit-map"
                value={formData.mapLink || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsed = parseGoogleMapsCoords(value);
                  setFormData({
                    ...formData,
                    mapLink: value,
                    lat: parsed?.lat,
                    lng: parsed?.lng,
                  });
                }}
                placeholder="Pegar enlace de Google Maps"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const next = await resolveCoordinates(formData);
                  setFormData(next);
                }}
                disabled={isResolvingMap}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            {(formData.lat !== undefined || formData.lng !== undefined) && (
              <p className="text-xs text-muted-foreground">
                {formData.lat}, {formData.lng}
              </p>
            )}
            {isResolvingMap && (
              <p className="text-xs text-muted-foreground">Resolviendo coordenadas...</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="activity-edit-tags" className="text-sm font-medium">Etiquetas (separadas por coma)</label>
            <input
              id="activity-edit-tags"
              value={(formData.tags || []).join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
