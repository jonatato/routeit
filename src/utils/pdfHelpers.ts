import type { TravelItinerary } from '../data/itinerary';

export function formatItineraryForPDF(itinerary: TravelItinerary): string {
  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #333; margin-bottom: 10px;">${itinerary.title}</h1>
      <p style="color: #666; margin-bottom: 20px;">${itinerary.dateRange}</p>
      <div style="margin-bottom: 30px;">${itinerary.intro}</div>
  `;

  // Add days
  itinerary.days.forEach((day) => {
    html += `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <h2 style="color: #333; margin-bottom: 10px;">Día ${day.dayLabel}</h2>
        <p style="color: #666; margin-bottom: 5px;"><strong>Ciudad:</strong> ${day.city}</p>
        <p style="color: #666; margin-bottom: 10px;"><strong>Plan:</strong> ${day.plan}</p>
    `;

    if (day.schedule.length > 0) {
      html += '<ul style="margin-left: 20px; margin-bottom: 10px;">';
      day.schedule.forEach((item) => {
        html += `<li style="margin-bottom: 5px;">${item.time} - ${item.activity}</li>`;
      });
      html += '</ul>';
    }

    if (day.notes.length > 0) {
      html += '<div style="background: #f5f5f5; padding: 10px; margin-bottom: 10px; border-radius: 5px;">';
      day.notes.forEach((note) => {
        html += `<p style="margin: 5px 0;">${note}</p>`;
      });
      html += '</div>';
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

export function getPDFPageSize(format: 'A4' | 'Letter', orientation: 'portrait' | 'landscape') {
  const sizes = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
  };

  const size = sizes[format];
  return orientation === 'landscape' ? { width: size.height, height: size.width } : size;
}
