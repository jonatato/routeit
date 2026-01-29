import { Button } from './ui/button';
import { Trash2, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import type { ScheduleItem } from '../data/itinerary';

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
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-3 hover:shadow-md transition-shadow group">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-primary">{item.time || '—'}</span>
          <h4 className="font-medium text-sm truncate">{item.activity || 'Sin actividad'}</h4>
        </div>
        {item.link && (
          <p className="text-xs text-muted-foreground truncate">{item.link}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map(tag => (
              <span key={tag} className="inline-block text-xs bg-muted px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove('up')}
          disabled={!canMoveUp}
          title="Mover arriba"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMove('down')}
          disabled={!canMoveDown}
          title="Mover abajo"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Eliminar"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
