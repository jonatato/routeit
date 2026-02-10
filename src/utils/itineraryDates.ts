import type { TravelItinerary, ItineraryDay, Flight } from '../data/itinerary';

type ParsedDay = { day: ItineraryDay; date: Date };

const monthMap: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dic: 11,
  jan: 0,
  febr: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const stripWeekdayPrefix = (value: string) => value.replace(/^[A-Za-z]{2,},?\s+/u, '').trim();

const normalize = (value: string) => value.trim().toLowerCase();

export const parseItineraryDate = (raw: string): Date | null => {
  if (!raw) return null;
  const value = normalize(stripWeekdayPrefix(raw));

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
  }

  const spanishMatch = value.match(/(\d{1,2})\s+de\s+([a-z]+)\s+(\d{4})/);
  if (spanishMatch) {
    const month = monthMap[spanishMatch[2]];
    if (month !== undefined) {
      return new Date(Number(spanishMatch[3]), month, Number(spanishMatch[1]));
    }
  }

  const shortMatch = value.match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{4})/);
  if (shortMatch) {
    const month = monthMap[shortMatch[2]];
    if (month !== undefined) {
      return new Date(Number(shortMatch[3]), month, Number(shortMatch[1]));
    }
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
};

const getEarliestDate = (dates: Array<Date | null>) => {
  const valid = dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  if (valid.length === 0) return null;
  valid.sort((a, b) => a.getTime() - b.getTime());
  return valid[0];
};

const parseDateRangeStart = (dateRange: string) => {
  if (!dateRange) return null;
  const patterns = [
    /\d{4}-\d{2}-\d{2}/,
    /\d{1,2}\/\d{1,2}\/\d{4}/,
    /\d{1,2}\s+de\s+[A-Za-z]+\s+\d{4}/,
    /\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}/,
  ];
  for (const pattern of patterns) {
    const match = dateRange.match(pattern);
    if (match) {
      const parsed = parseItineraryDate(match[0]);
      if (parsed) return parsed;
    }
  }
  return null;
};

export const getItineraryStartDate = (itinerary: TravelItinerary): Date | null => {
  const dayDates = itinerary.days.map(day => parseItineraryDate(day.date));
  const earliestDay = getEarliestDate(dayDates);
  if (earliestDay) return earliestDay;

  const flightDates: Array<Date | null> = [];
  if (itinerary.flightsList) {
    itinerary.flightsList.forEach(flight => {
      flightDates.push(parseItineraryDate(flight.date));
    });
  }
  flightDates.push(parseItineraryDate(itinerary.flights?.outbound?.date ?? ''));
  flightDates.push(parseItineraryDate(itinerary.flights?.inbound?.date ?? ''));
  const earliestFlight = getEarliestDate(flightDates);
  if (earliestFlight) return earliestFlight;

  return parseDateRangeStart(itinerary.dateRange);
};

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const getDayForDate = (itinerary: TravelItinerary, date: Date): ParsedDay | null => {
  for (const day of itinerary.days) {
    const parsed = parseItineraryDate(day.date);
    if (!parsed) continue;
    if (isSameDay(parsed, date)) {
      return { day, date: parsed };
    }
  }
  return null;
};

export const getSortedDays = (itinerary: TravelItinerary): ParsedDay[] => {
  return itinerary.days
    .map(day => ({ day, date: parseItineraryDate(day.date) }))
    .filter((entry): entry is ParsedDay => Boolean(entry.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const getNextDayFromDate = (itinerary: TravelItinerary, date: Date): ParsedDay | null => {
  const sorted = getSortedDays(itinerary);
  return sorted.find(entry => entry.date.getTime() >= new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) ?? null;
};

export const getPrimaryFlightLabel = (flight?: Flight) => {
  if (!flight) return '';
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  if (flight.label) return flight.label;
  if (firstSegment && lastSegment) {
    return `${firstSegment.departureCity} → ${lastSegment.arrivalCity}`;
  }
  return '';
};
