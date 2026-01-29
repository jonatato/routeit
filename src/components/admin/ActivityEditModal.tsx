import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { ScheduleItem } from '../../data/itinerary';
import type { SplitMember } from '../../services/split';

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
  onSave: (item: ScheduleItem) => void;
  splitMembers: SplitMember[];
}

export function ActivityEditModal({
  isOpen,
  onClose,
  item,
  onSave,
  splitMembers,
}: ActivityEditModalProps) {
  const [editedItem, setEditedItem] = useState<ScheduleItem>({
    time: '',
    activity: '',
    link: '',
    mapLink: '',
    lat: undefined,
    lng: undefined,
    tags: [],
  });

  const [coordInput, setCoordInput] = useState('');

  useEffect(() => {
    if (item) {
      setEditedItem(item);
      setCoordInput(
        item.lat !== undefined && item.lng !== undefined
          ? `${item.lat}, ${item.lng}`
          : item.mapLink || ''
      );
    } else {
      setEditedItem({
        time: '',
        activity: '',
        link: '',
        mapLink: '',
        lat: undefined,
        lng: undefined,
        tags: [],
      });
      setCoordInput('');
    }
  }, [item]);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const handleCoordInput = (value: string) => {
    setCoordInput(value);
    // Parse coordinates if it's a lat,lng format
    const coords = value.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setEditedItem(prev => ({
        ...prev,
        lat: coords[0],
        lng: coords[1],
        mapLink: '',
      }));
    } else {
      setEditedItem(prev => ({
        ...prev,
        mapLink: value,
        lat: undefined,
        lng: undefined,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Hora</label>
              <input
                type="time"
                value={editedItem.time}
                onChange={(e) => setEditedItem(prev => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Actividad</label>
              <input
                value={editedItem.activity}
                onChange={(e) => setEditedItem(prev => ({ ...prev, activity: e.target.value }))}
                placeholder="Nombre de la actividad"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Enlace (opcional)</label>
            <input
              value={editedItem.link || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Ubicación (opcional)</label>
            <input
              value={coordInput}
              onChange={(e) => handleCoordInput(e.target.value)}
              placeholder="Pegar link de Google Maps o 'lat, lng'"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Etiquetas (opcional)</label>
            <input
              value={editedItem.tags?.join(', ') || ''}
              onChange={(e) => setEditedItem(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="etiquetas separadas por coma"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Cost section */}
          <div className="space-y-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              💰 Gasto (opcional - se añade automáticamente a Split)
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedItem.cost || ''}
                  onChange={(e) => setEditedItem(prev => ({
                    ...prev,
                    cost: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  placeholder="Precio total"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <select
                  value={editedItem.costCurrency || 'EUR'}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, costCurrency: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!editedItem.cost}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>
            </div>
            {editedItem.cost && (
              <div>
                <select
                  value={editedItem.costPayerId || ''}
                  onChange={(e) => setEditedItem(prev => ({
                    ...prev,
                    costPayerId: e.target.value || undefined
                  }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">¿Quién pagó?</option>
                  {splitMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                {editedItem.costPayerId && splitMembers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Se dividirá entre {splitMembers.length} personas
                    ({(editedItem.cost / splitMembers.length).toFixed(2)} {editedItem.costCurrency || 'EUR'} por persona)
                  </p>
                )}
                {splitMembers.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Añade miembros en la sección de Gastos primero
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}