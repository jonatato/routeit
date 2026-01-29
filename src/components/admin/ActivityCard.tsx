import React, { useState } from 'react';
import type { ScheduleItem } from '../../data/itinerary';

interface ActivityCardProps {
  item: ScheduleItem;
  index: number;
  onEdit: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ActivityCard({
  item,
  index,
  onEdit,
  onMove,
  onDelete,
  canMoveUp,
  canMoveDown,
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{item.time || 'Sin hora'}</p>
            <p className="text-sm text-muted-foreground truncate">{item.activity || 'Nueva actividad'}</p>
            {item.cost && (
              <p className="text-xs text-amber-600 font-medium">€{item.cost.toFixed(2)}</p>
            )}
          </div>
          <div className="ml-2 text-muted-foreground">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Actividad</p>
              <p className="text-foreground">{item.activity || <span className="text-muted-foreground italic">Haz clic en editar para añadir detalles</span>}</p>
            </div>

            {item.link && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Enlace</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {item.link}
                </a>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.cost && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Gasto</p>
                <p className="text-foreground font-semibold">€{item.cost.toFixed(2)}</p>
              </div>
            )}

            {(item.lat !== undefined && item.lng !== undefined) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Ubicación</p>
                <p className="text-foreground font-mono text-xs">{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onMove('up')}
              disabled={!canMoveUp}
              className="px-2 py-2 border border-border rounded text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Mover arriba"
            >
              ↑
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={!canMoveDown}
              className="px-2 py-2 border border-border rounded text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Mover abajo"
            >
              ↓
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-2 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 transition-colors"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
