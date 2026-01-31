import type { Flight } from '../data/itinerary';

/**
 * Generate an iCalendar (.ics) file content for a flight
 */
export function generateFlightICS(flight: Flight): string {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    throw new Error('Flight must have at least one segment');
  }

  // Parse date and time
  const flightDate = parseFlightDate(flight.date);
  const startDateTime = combineDateAndTime(flightDate, firstSegment.departureTime);
  const endDateTime = combineDateAndTime(flightDate, lastSegment.arrivalTime);

  // Handle flights that arrive the next day
  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  // Build description
  const descriptionParts: string[] = [];
  
  if (flight.bookingReference) {
    descriptionParts.push(`Referencia: ${flight.bookingReference}`);
  }
  if (flight.seat) {
    descriptionParts.push(`Asiento: ${flight.seat}`);
  }
  if (flight.cabinClass) {
    const cabinLabels: Record<string, string> = {
      economy: 'Economy',
      premium_economy: 'Premium Economy',
      business: 'Business',
      first: 'First Class',
    };
    descriptionParts.push(`Clase: ${cabinLabels[flight.cabinClass]}`);
  }
  
  // Add segment details
  if (flight.segments.length > 1) {
    descriptionParts.push('');
    descriptionParts.push('Segmentos:');
    flight.segments.forEach((seg, index) => {
      const segmentInfo = [
        `${index + 1}. ${seg.departureCity} (${seg.departureAirport}) → ${seg.arrivalCity} (${seg.arrivalAirport})`,
        `   ${seg.departureTime} - ${seg.arrivalTime}`,
      ];
      if (seg.airline && seg.flightNumber) {
        segmentInfo.push(`   Vuelo: ${seg.airline} ${seg.flightNumber}`);
      }
      if (seg.departureTerminal) {
        segmentInfo.push(`   Terminal salida: ${seg.departureTerminal}`);
      }
      if (seg.arrivalTerminal) {
        segmentInfo.push(`   Terminal llegada: ${seg.arrivalTerminal}`);
      }
      descriptionParts.push(...segmentInfo);
    });
  } else {
    if (firstSegment.airline && firstSegment.flightNumber) {
      descriptionParts.push(`Vuelo: ${firstSegment.airline} ${firstSegment.flightNumber}`);
    }
    if (firstSegment.departureTerminal) {
      descriptionParts.push(`Terminal salida: ${firstSegment.departureTerminal}`);
    }
    if (lastSegment.arrivalTerminal) {
      descriptionParts.push(`Terminal llegada: ${lastSegment.arrivalTerminal}`);
    }
  }

  const summary = flight.label || `Vuelo ${firstSegment.departureCity} → ${lastSegment.arrivalCity}`;
  const location = `${firstSegment.departureCity} (${firstSegment.departureAirport})`;
  const description = descriptionParts.join('\\n');

  // Generate ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RouteIt//Flight Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${flight.id}@routeit.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `LOCATION:${escapeICSText(location)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de vuelo - 3 horas antes',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de vuelo - 1 día antes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Download flight as .ics file
 */
export function downloadFlightICS(flight: Flight): void {
  const icsContent = generateFlightICS(flight);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const filename = `vuelo-${firstSegment?.departureAirport}-${lastSegment?.arrivalAirport}-${flight.date.replace(/\s/g, '-')}.ics`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse various date formats to a Date object
 */
function parseFlightDate(dateStr: string): Date {
  // Try to parse common formats
  // "15 de marzo 2026", "15 Mar 2026", "2026-03-15", "15/03/2026"
  
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Try ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // Try "DD de MONTH YYYY" format
  const spanishMatch = dateStr.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)\s+(\d{4})/);
  if (spanishMatch) {
    const day = parseInt(spanishMatch[1]);
    const month = months[spanishMatch[2]];
    const year = parseInt(spanishMatch[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Try "DD MMM YYYY" format
  const shortMatch = dateStr.toLowerCase().match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (shortMatch) {
    const day = parseInt(shortMatch[1]);
    const month = months[shortMatch[2]];
    const year = parseInt(shortMatch[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Try DD/MM/YYYY format
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(parseInt(slashMatch[3]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }

  // Fallback to Date.parse
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  // Default to today if all parsing fails
  console.warn(`Could not parse date: ${dateStr}`);
  return new Date();
}

/**
 * Combine a date and time string into a Date object
 */
function combineDateAndTime(date: Date, timeStr: string): Date {
  const result = new Date(date);
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    result.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
  }
  return result;
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
