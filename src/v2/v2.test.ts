import { describe, expect, it } from 'vitest';
import { buildTripAlerts } from './alerts';
import { buildTripFromDraft, parseCityList } from './draftTrip';
import { buildLedger, expensesFromItinerary, paymentsForSettlements, withActivity } from './ledger';
import { activeDestination, destinationHref, redirectFor } from './navigation';
import { buildSampleTrip } from './sampleTrip';
import { agendaStatus, filterSchedule, focusDay } from './today';

const saturdayMorning = new Date(2026, 9, 17, 9, 15);

describe('navegación v2', () => {
  it('marca el destino activo en la app y en la vista previa', () => {
    expect(activeDestination('/app')).toBe('today');
    expect(activeDestination('/app/plan')).toBe('plan');
    expect(activeDestination('/app/money')).toBe('money');
    expect(activeDestination('/app/documents')).toBe('more');
    expect(activeDestination('/preview/plan')).toBe('plan');
  });

  it('apunta las rutas retiradas a un destino v2', () => {
    expect(redirectFor('/app/today')).toBe('/app');
    expect(redirectFor('/app/memories')).toBe('/app');
    expect(redirectFor('/app/analytics')).toBe('/app');
    expect(redirectFor('/app/split')).toBe('/app/money');
    expect(redirectFor('/app/admin')).toBe('/app/plan');
    expect(redirectFor('/app/search')).toBe('/app/plan');
    expect(redirectFor('/store')).toBe('/pricing');
    expect(destinationHref('/app', 'money')).toBe('/app/money');
  });
});

describe('viaje de prueba Lisboa', () => {
  it('recorre hoy, el plan, el dinero y la maleta', () => {
    const trip = buildSampleTrip();
    const focus = focusDay(trip.itinerary, saturdayMorning);
    expect(focus?.day.city).toBe('Lisboa');
    expect(focus?.day.date).toBe('2026-10-17');

    const agenda = agendaStatus(focus!.day, saturdayMorning);
    expect(agenda.current?.activity).toBe('Llegada a Lisboa');
    expect(agenda.next?.activity).toBe('Tranvía 28');

    const expenses = expensesFromItinerary(trip.itinerary, trip.members[0].id);
    const ledger = buildLedger(trip.members, expenses, trip.payments);
    expect(ledger.total).toBe(58);
    expect(ledger.settlements).toEqual([
      { fromId: 'ana', toId: 'luis', fromName: 'Ana', toName: 'Luis', amount: 3 },
    ]);

    const alerts = buildTripAlerts({
      day: focus!.day,
      bag: trip.bag,
      settlementCount: ledger.settlements.length,
    });
    expect(alerts.map(alert => alert.id)).toEqual(['ticket-Llegada a Lisboa', 'bag', 'balance']);

    const settled = buildLedger(trip.members, expenses, paymentsForSettlements(ledger.settlements));
    expect(settled.settlements).toEqual([]);

    const withNote = withActivity(
      trip.itinerary,
      0,
      { time: '19:00', activity: 'Cena en Bairro Alto', cost: 40, costCurrency: 'EUR', costPayerId: 'luis' },
    );
    expect(withNote.days[0].schedule.at(-1)?.activity).toBe('Cena en Bairro Alto');
    expect(filterSchedule(focus!.day, 'tranvía')).toHaveLength(1);
  });

  it('antes del primer horario solo muestra la siguiente actividad', () => {
    const trip = buildSampleTrip();
    const day = focusDay(trip.itinerary, saturdayMorning)!.day;
    const agenda = agendaStatus(day, new Date(2026, 9, 17, 7, 0));
    expect(agenda.current).toBeNull();
    expect(agenda.next?.activity).toBe('Llegada a Lisboa');
  });
});

describe('alta de un viaje', () => {
  it('crea un día por fecha y reparte las ciudades', () => {
    const cities = parseCityList('Oporto, Lisboa');
    const itinerary = buildTripFromDraft({
      title: 'Norte',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      cities,
    });
    expect(itinerary.days).toHaveLength(3);
    expect(itinerary.days.map(day => day.city)).toEqual(['Oporto', 'Lisboa', 'Lisboa']);
    expect(itinerary.days[0].date).toBe('2026-11-01');
    expect(itinerary.days[2].date).toBe('2026-11-03');
    expect(itinerary.phrases).toEqual([]);
  });
});
