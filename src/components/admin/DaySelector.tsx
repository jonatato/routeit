import React from 'react';
import type { ItineraryDay } from '../../data/itinerary';

interface DaySelectorProps {
  days: ItineraryDay[];
  activeDayIndex: number;
  onDaySelect: (index: number) => void;
  onDayDelete: (index: number) => void;
  onDayAdd: () => void;
}

export function DaySelector({ days, activeDayIndex, onDaySelect, onDayDelete, onDayAdd }: DaySelectorProps) {
  const activeDay = days[activeDayIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Selecciona un día:</h3>
        <div className="space-y-2">
          {days.map((day, index) => (
            <button
              key={day.id}
              onClick={() => onDaySelect(index)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                index === activeDayIndex
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Día {day.dayLabel}</p>
                  <p className="text-xs text-muted-foreground truncate">{day.city}</p>
                  <p className="text-xs text-muted-foreground">{day.schedule.length} actividades</p>
                </div>
                {index === activeDayIndex && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayDelete(index);
                    }}
                    className="ml-2 p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                    title="Eliminar día"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onDayAdd}
        className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-primary/40 text-primary font-medium text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
      >
        <span className="text-lg">+</span>
        Agregar Día
      </button>
    </div>
  );
}
