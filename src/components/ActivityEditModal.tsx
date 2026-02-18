import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { ScheduleItem } from '../data/itinerary';
import { MapPin } from 'lucide-react';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
  onSave: (item: ScheduleItem) => void;
  splitMembers?: Array<{ id: string; name: string }>;
}

export function ActivityEditModal({
  isOpen,
  onClose,
  item,
  onSave,
  splitMembers = [],
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState<ScheduleItem>({
    time: '',
    activity: '',
    link: '',
    mapLink: '',
    tags: [],
  });

  useEffect(() => {
    if (!item) return;
    // The form needs to be rehydrated when switching the edited activity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(item);
  }, [item]);

  const handleSave = () => {
    onSave(formData);
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
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                placeholder="Pegar enlace de Google Maps"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            {(formData.lat !== undefined || formData.lng !== undefined) && (
              <p className="text-xs text-muted-foreground">
                {formData.lat}, {formData.lng}
              </p>
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

          {splitMembers.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="activity-edit-payer" className="text-sm font-medium">Quién paga (opcional)</label>
              <select
                id="activity-edit-payer"
                value={formData.costPayerId || ''}
                onChange={(e) => setFormData({ ...formData, costPayerId: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Nadie</option>
                {splitMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="activity-edit-cost" className="text-sm font-medium">Costo</label>
              <input
                id="activity-edit-cost"
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="activity-edit-currency" className="text-sm font-medium">Moneda</label>
              <input
                id="activity-edit-currency"
                value={formData.costCurrency || ''}
                onChange={(e) => setFormData({ ...formData, costCurrency: e.target.value })}
                placeholder="USD, EUR, etc."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
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
