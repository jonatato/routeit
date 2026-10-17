import type { ItineraryDay, ScheduleItem, TravelItinerary } from '../data/itinerary';
import { getDayForDate, getNextDayFromDate, getSortedDays } from '../utils/itineraryDates';

export type Agenda = {
  current: ScheduleItem | null;
  next: ScheduleItem | null;
};

const startMinutes = (time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export function focusDay(itinerary: TravelItinerary, now: Date) {
  return getDayForDate(itinerary, now) ?? getNextDayFromDate(itinerary, now) ?? getSortedDays(itinerary).at(-1) ?? null;
}

export function agendaStatus(day: ItineraryDay, now: Date): Agenda {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const timed = day.schedule
    .map((item, index) => ({ item, index, start: startMinutes(item.time) }))
    .filter((entry): entry is { item: ScheduleItem; index: number; start: number } => entry.start !== null)
    .sort((a, b) => a.start - b.start);

  let current: ScheduleItem | null = null;
  let next: ScheduleItem | null = null;

  for (let index = 0; index < timed.length; index += 1) {
    const entry = timed[index];
    const end = timed[index + 1]?.start ?? entry.start + 90;
    if (minutes >= entry.start && minutes < end) {
      current = entry.item;
      next = timed[index + 1]?.item ?? null;
      break;
    }
    if (minutes < entry.start) {
      next = entry.item;
      break;
    }
  }

  return { current, next };
}

export type TripAlert = {
  id: string;
  text: string;
};

export function missingTicketAlerts(day: ItineraryDay | null): TripAlert[] {
  if (!day) return [];
  return day.schedule
    .filter(item => (item.tags ?? []).some(tag => tag.toLowerCase() === 'vuelo') && !item.documentId)
    .map(item => ({
      id: `ticket-${item.activity}`,
      text: `Falta el billete de ${item.activity}.`,
    }));
}

export function filterSchedule(day: ItineraryDay, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return day.schedule;
  return day.schedule.filter(item =>
    [item.time, item.activity, item.mapLink, ...(item.tags ?? [])].join(' ').toLowerCase().includes(normalized),
  );
}
