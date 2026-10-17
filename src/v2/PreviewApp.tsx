import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { buildTripAlerts } from './alerts';
import { MoneyView } from './components/MoneyView';
import { MoreView } from './components/MoreView';
import { PlanView } from './components/PlanView';
import { TodayView } from './components/TodayView';
import { V2Chrome } from './components/V2Chrome';
import { buildLedger, expensesFromItinerary } from './ledger';
import { activeDestination } from './navigation';
import { buildSampleTrip, type V2Trip } from './sampleTrip';
import { agendaStatus, focusDay } from './today';

function PreviewApp() {
  const location = useLocation();
  const [trip, setTrip] = useState<V2Trip>(() => buildSampleTrip());
  const section = activeDestination(location.pathname);
  const now = useMemo(() => new Date(2026, 9, 17, 9, 15), []);
  const focus = focusDay(trip.itinerary, now);
  const agenda = focus ? agendaStatus(focus.day, now) : { current: null, next: null };
  const expenses = expensesFromItinerary(trip.itinerary, trip.members[0]?.id ?? 'ana');
  const ledger = buildLedger(trip.members, expenses, trip.payments);
  const alerts = buildTripAlerts({
    day: focus?.day ?? null,
    bag: trip.bag,
    settlementCount: ledger.settlements.length,
  });
  const mapHref = agenda.current?.mapLink ?? agenda.next?.mapLink ?? focus?.day.schedule.find(item => item.mapLink)?.mapLink;

  return (
    <V2Chrome base="/preview" title={trip.itinerary.title} subtitle={trip.itinerary.dateRange}>
      {section === 'today' && focus && (
        <TodayView
          title={focus.day.city}
          dateLabel={focus.day.date}
          plan={focus.day.plan}
          agenda={agenda}
          alerts={alerts}
          mapHref={mapHref}
          planHref="/preview/plan"
        />
      )}
      {section === 'plan' && (
        <PlanView
          itinerary={trip.itinerary}
          members={trip.members}
          editable
          onChange={itinerary => setTrip(current => ({ ...current, itinerary }))}
        />
      )}
      {section === 'money' && (
        <MoneyView
          ledger={ledger}
          onSettle={settlement => setTrip(current => ({
            ...current,
            payments: [
              ...current.payments,
              { id: `pay-${current.payments.length + 1}`, fromId: settlement.fromId, toId: settlement.toId, amount: settlement.amount },
            ],
          }))}
        />
      )}
      {section === 'more' && (
        <MoreView
          bag={trip.bag}
          documents={trip.documents}
          onToggleBag={id => setTrip(current => ({
            ...current,
            bag: current.bag.map(item => (item.id === id ? { ...item, packed: !item.packed } : item)),
          }))}
          onReset={() => setTrip(buildSampleTrip())}
          links={[]}
        />
      )}
    </V2Chrome>
  );
}

export default PreviewApp;
