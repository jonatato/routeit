import type { TravelItinerary } from '../data/itinerary';
import type { LedgerMember, LedgerPayment } from './ledger';

export type TripDocument = {
  id: string;
  title: string;
  kind: 'passport' | 'booking' | 'ticket' | 'other';
  activityId?: string;
};

export type BagItem = {
  id: string;
  name: string;
  packed: boolean;
};

export type V2Trip = {
  itinerary: TravelItinerary;
  members: LedgerMember[];
  documents: TripDocument[];
  bag: BagItem[];
  payments: LedgerPayment[];
};

const emptyLegacy = {
  date: '',
  fromTime: '',
  toTime: '',
  fromCity: '',
  toCity: '',
  duration: '',
  stops: '',
};

export function buildSampleTrip(): V2Trip {
  const itinerary: TravelItinerary = {
    id: 'sample-lisboa',
    title: 'Lisboa, fin de semana',
    startDate: '2026-10-17',
    endDate: '2026-10-19',
    dateRange: '17–19 oct 2026',
    intro: 'Tres días para comprobar Hoy, el plan, el dinero y la maleta.',
    days: [
      {
        id: 'day-1',
        dayLabel: 'Día 1',
        date: '2026-10-17',
        city: 'Lisboa',
        plan: 'Llegada y centro',
        notes: [],
        kind: 'city',
        schedule: [
          {
            time: '08:30',
            activity: 'Llegada a Lisboa',
            tags: ['vuelo'],
            mapLink: 'https://maps.google.com/?q=Lisbon+Airport',
            lat: 38.7742,
            lng: -9.1342,
          },
          {
            time: '11:00',
            activity: 'Tranvía 28',
            mapLink: 'https://maps.google.com/?q=Tram+28+Lisbon',
            lat: 38.7139,
            lng: -9.1334,
            cost: 8,
            costCurrency: 'EUR',
            costPayerId: 'ana',
          },
          {
            time: '14:00',
            activity: 'Time Out Market',
            mapLink: 'https://maps.google.com/?q=Time+Out+Market+Lisboa',
            lat: 38.7071,
            lng: -9.1457,
            cost: 32,
            costCurrency: 'EUR',
            costPayerId: 'luis',
          },
        ],
      },
      {
        id: 'day-2',
        dayLabel: 'Día 2',
        date: '2026-10-18',
        city: 'Belém',
        plan: 'Belém y descanso',
        notes: [],
        kind: 'city',
        schedule: [
          {
            time: '10:00',
            activity: 'Pastéis de Belém',
            mapLink: 'https://maps.google.com/?q=Pasteis+de+Belem',
            cost: 18,
            costCurrency: 'EUR',
            costPayerId: 'ana',
            documentId: 'doc-hotel',
          },
          {
            time: '16:00',
            activity: 'Tarde libre en Alfama',
          },
        ],
      },
      {
        id: 'day-3',
        dayLabel: 'Día 3',
        date: '2026-10-19',
        city: 'Lisboa',
        plan: 'Vuelta',
        notes: [],
        kind: 'flight',
        schedule: [
          {
            time: '16:40',
            activity: 'Vuelo de vuelta',
            tags: ['vuelo'],
            documentId: 'doc-return',
            mapLink: 'https://maps.google.com/?q=Lisbon+Airport',
          },
        ],
      },
    ],
    budgetTiers: [],
    foods: [],
    tips: [],
    avoid: [],
    utilities: [],
    packing: [],
    money: [],
    connectivity: [],
    transport: [],
    safety: [],
    etiquette: [],
    weather: [],
    scams: [],
    budgetTips: [],
    emergency: [],
    phrases: [],
    locations: [
      { city: 'Lisboa', label: 'Lisboa', lat: 38.7223, lng: -9.1393 },
      { city: 'Belém', label: 'Belém', lat: 38.697, lng: -9.206 },
    ],
    route: ['Lisboa', 'Belém', 'Lisboa'],
    flightsList: [],
    flights: { outbound: { ...emptyLegacy }, inbound: { ...emptyLegacy } },
  };

  return {
    itinerary,
    members: [
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
    ],
    documents: [
      { id: 'doc-hotel', title: 'Hotel Baixa', kind: 'booking', activityId: 'day-2' },
      { id: 'doc-return', title: 'Billete de vuelta', kind: 'ticket' },
    ],
    bag: [
      { id: 'bag-passport', name: 'Pasaporte', packed: true },
      { id: 'bag-adapter', name: 'Adaptador', packed: false },
    ],
    payments: [],
  };
}
