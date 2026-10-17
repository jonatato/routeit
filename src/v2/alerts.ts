import type { ItineraryDay } from '../data/itinerary';
import type { BagItem } from './sampleTrip';
import { missingTicketAlerts, type TripAlert } from './today';

export function buildTripAlerts(input: {
  day: ItineraryDay | null;
  bag: BagItem[];
  settlementCount: number;
}): TripAlert[] {
  const alerts = missingTicketAlerts(input.day);
  const unpacked = input.bag.filter(item => !item.packed);
  if (unpacked.length > 0) {
    alerts.push({
      id: 'bag',
      text: unpacked.length === 1 ? `Sin marcar: ${unpacked[0].name}.` : `${unpacked.length} cosas de la maleta sin marcar.`,
    });
  }
  if (input.settlementCount > 0) {
    alerts.push({
      id: 'balance',
      text: input.settlementCount === 1 ? 'Hay un saldo por saldar.' : `Hay ${input.settlementCount} saldos por saldar.`,
    });
  }
  return alerts;
}
