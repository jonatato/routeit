import { Button } from './ui/button';
import { Trash2, Plus } from 'lucide-react';
import type { ItineraryDay } from '../data/itinerary';

interface DaySelectorProps {
  days: ItineraryDay[];
  activeDayIndex: number;
  onDaySelect: (index: number) => void;
  onDayDelete: (index: number) => void;
  onDayAdd: () => void;
}

export function DaySelector({ days, activeDayIndex, onDaySelect, onDayDelete, onDayAdd }: DaySelectorProps) {
  return (
    <div className="space-y-2">
      {days.map((day, idx) => (
        <div key={day.id} className="flex items-center gap-2">
          <Button
            variant={activeDayIndex === idx ? 'default' : 'outline'}
            className="flex-1 flex-col items-start h-auto py-2"
            onClick={() => onDaySelect(idx)}
          >
            <div className="font-semibold">Día {day.dayLabel}</div>
            <div className="text-xs text-muted-foreground">{day.city || 'Sin ciudad'}</div>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDayDelete(idx)}
            className="h-auto p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full"
        onClick={onDayAdd}
      >
        <Plus className="mr-2 h-4 w-4" />
        Añadir día
      </Button>
    </div>
  );
}
