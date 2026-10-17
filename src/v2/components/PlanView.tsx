import { useState } from 'react';
import type { ScheduleItem, TravelItinerary } from '../../data/itinerary';
import { filterSchedule } from '../today';
import type { LedgerMember } from '../ledger';
import { ActivitySheet } from './ActivitySheet';

type PlanViewProps = {
  itinerary: TravelItinerary;
  members: LedgerMember[];
  editable: boolean;
  onChange: (itinerary: TravelItinerary) => void;
};

export function PlanView({ itinerary, members, editable, onChange }: PlanViewProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const day = itinerary.days[dayIndex] ?? itinerary.days[0];
  const visible = day ? filterSchedule(day, query) : [];

  if (!day) {
    return <p className="text-sm text-mutedForeground">Este viaje todavía no tiene días.</p>;
  }

  const save = (item: ScheduleItem) => {
    const schedule = [...day.schedule];
    if (editing === 'new') schedule.push(item);
    else if (typeof editing === 'number') schedule[editing] = item;
    onChange({
      ...itinerary,
      days: itinerary.days.map((entry, index) => (index === dayIndex ? { ...entry, schedule } : entry)),
    });
    setEditing(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto">
        {itinerary.days.map((entry, index) => (
          <button
            key={entry.id || entry.date}
            type="button"
            onClick={() => {
              setDayIndex(index);
              setEditing(null);
            }}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${index === dayIndex ? 'border-foreground bg-foreground text-background' : 'border-border'}`}
          >
            {entry.dayLabel}
          </button>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{day.city}</h2>
        <p className="text-sm text-mutedForeground">{day.date}. {day.plan}</p>
      </div>
      <label className="grid gap-1 text-sm">
        Buscar en el día
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2"
          placeholder="Hora, lugar o actividad"
        />
      </label>
      <ol className="grid gap-2">
        {visible.map(item => {
          const index = day.schedule.indexOf(item);
          return (
            <li key={`${item.time}-${item.activity}`}>
              <button
                type="button"
                disabled={!editable}
                onClick={() => setEditing(index)}
                className="flex w-full items-baseline justify-between gap-4 rounded-lg border border-border px-3 py-3 text-left"
              >
                <span>{item.activity}</span>
                <span className="text-sm tabular-nums text-mutedForeground">{item.time}</span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && <li className="text-sm text-mutedForeground">Nada coincide con la búsqueda.</li>}
      </ol>
      {editable && editing === null && (
        <button type="button" onClick={() => setEditing('new')} className="w-fit rounded-lg border border-border px-3 py-2 text-sm">
          Añadir actividad
        </button>
      )}
      {editing !== null && (
        <ActivitySheet
          initial={editing === 'new' ? null : day.schedule[editing]}
          members={members}
          onCancel={() => setEditing(null)}
          onSave={save}
          onDelete={editing === 'new' ? undefined : () => {
            onChange({
              ...itinerary,
              days: itinerary.days.map((entry, index) => (
                index === dayIndex
                  ? { ...entry, schedule: entry.schedule.filter((_, scheduleIndex) => scheduleIndex !== editing) }
                  : entry
              )),
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
