import { Link } from 'react-router-dom';
import type { ItineraryDay } from '../../data/itinerary';
import type { TripAlert } from '../today';
import type { Agenda } from '../today';

type TodayViewProps = {
  title: string;
  dateLabel: string;
  plan: string;
  agenda: Agenda;
  alerts: TripAlert[];
  mapHref?: string;
  planHref: string;
  empty?: string;
};

function ActivityLine({ label, item }: { label: string; item: { time: string; activity: string } }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-3 first:border-t-0">
      <div>
        <p className="text-xs text-mutedForeground">{label}</p>
        <p className="text-base font-medium">{item.activity}</p>
      </div>
      <p className="text-sm tabular-nums text-mutedForeground">{item.time}</p>
    </div>
  );
}

export function TodayView({ title, dateLabel, plan, agenda, alerts, mapHref, planHref, empty }: TodayViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div>
        <p className="text-sm text-mutedForeground">{dateLabel}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-mutedForeground">{plan}</p>
      </div>

      {empty ? (
        <p className="text-sm text-mutedForeground">{empty}</p>
      ) : (
        <section>
          {agenda.current && <ActivityLine label="Ahora" item={agenda.current} />}
          {agenda.next && <ActivityLine label="Siguiente" item={agenda.next} />}
          {!agenda.current && !agenda.next && <p className="text-sm text-mutedForeground">No queda nada en el horario de este día.</p>}
        </section>
      )}

      {mapHref && (
        <a className="text-sm font-medium underline" href={mapHref} target="_blank" rel="noreferrer">
          Abrir el mapa del lugar
        </a>
      )}

      {alerts.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Pendiente</h3>
          <ul className="grid gap-2 text-sm">
            {alerts.map(alert => (
              <li key={alert.id} className="rounded-lg border border-border px-3 py-2">{alert.text}</li>
            ))}
          </ul>
        </section>
      )}

      <Link to={planHref} className="text-sm font-medium underline">Ver el día completo</Link>
    </div>
  );
}

export function dayHeading(day: ItineraryDay) {
  return `${day.dayLabel} · ${day.date}`;
}
