import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TravelItinerary } from '../data/itinerary';

export type PDFVisualStyle = 'standard' | 'booklet';

export type PDFExportOptions = {
  sections: {
    overview: boolean;
    itinerary: boolean;
    map: boolean;
    budget: boolean;
    lists: boolean;
    phrases: boolean;
    flights: boolean;
  };
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeMap: boolean;
  visualStyle: PDFVisualStyle;
};

const defaultOptions: PDFExportOptions = {
  sections: {
    overview: true,
    itinerary: true,
    map: true,
    budget: true,
    lists: true,
    phrases: true,
    flights: true,
  },
  format: 'A4',
  orientation: 'portrait',
  includeMap: true,
  visualStyle: 'standard',
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const safeText = (value?: string | null): string => (value ? escapeHtml(value) : '');

const sectionTitle = (title: string, subtitle?: string) => `
  <header class="rt-section-header">
    <h2>${safeText(title)}</h2>
    ${subtitle ? `<p>${safeText(subtitle)}</p>` : ''}
  </header>
`;

const sectionLabelMap: Record<keyof PDFExportOptions['sections'], string> = {
  overview: 'Resumen',
  itinerary: 'Itinerario',
  map: 'Mapa',
  budget: 'Presupuesto',
  lists: 'Listas útiles',
  phrases: 'Frases útiles',
  flights: 'Vuelos',
};

const getSelectedSectionLabels = (options: PDFExportOptions) =>
  (Object.entries(options.sections) as Array<[keyof PDFExportOptions['sections'], boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([section]) => sectionLabelMap[section]);

function renderBookletCover(itinerary: TravelItinerary, sectionLabels: string[]): string {
  const routeSummary = itinerary.route.slice(0, 7).join(' • ');
  return `
    <section class="rt-booklet-cover">
      <div class="rt-booklet-cover-inner">
        <p class="rt-kicker">Cuadernillo de recuerdo</p>
        <h1>${safeText(itinerary.title)}</h1>
        <p class="rt-date">${safeText(itinerary.dateRange)}</p>
        <p class="rt-intro">${safeText(stripHtml(itinerary.intro))}</p>
        <div class="rt-booklet-route">
          <strong>Ruta</strong>
          <p>${safeText(routeSummary || 'Ruta por definir')}</p>
        </div>
        <div class="rt-booklet-meta">
          <span>${itinerary.days.length} días</span>
          <span>${itinerary.locations.length} ciudades</span>
          <span>${new Date().toLocaleDateString('es-ES')}</span>
        </div>
      </div>
      <div class="rt-booklet-toc">
        <h3>Índice del cuadernillo</h3>
        <ol>
          ${sectionLabels.map(label => `<li>${safeText(label)}</li>`).join('')}
        </ol>
      </div>
    </section>
  `;
}

function renderBookletClosing(itinerary: TravelItinerary): string {
  const memories = itinerary.days
    .slice(0, 3)
    .map(day => day.schedule[0]?.activity || day.plan)
    .filter(Boolean)
    .map(item => `<li>${safeText(item)}</li>`)
    .join('');

  return `
    <section class="rt-booklet-closing">
      <h2>Notas del recuerdo</h2>
      <p>Espacio final para anotar anécdotas, gastos reales, recomendaciones y momentos favoritos del viaje.</p>
      <div class="rt-booklet-closing-grid">
        <article>
          <h3>Momentos destacados</h3>
          <ul>${memories || '<li>Tu próxima gran experiencia empieza aquí.</li>'}</ul>
        </article>
        <article>
          <h3>Checklist post-viaje</h3>
          <ul>
            <li>Guardar fotos favoritas</li>
            <li>Compartir recomendaciones</li>
            <li>Planear la próxima escapada</li>
          </ul>
        </article>
      </div>
    </section>
  `;
}

function renderHeaderSection(itinerary: TravelItinerary): string {
  const hasCover = Boolean(itinerary.coverImage);
  const flightsCount = itinerary.days.filter(day => day.kind === 'flight').length;
  return `
    <section class="rt-hero">
      ${
        hasCover
          ? `<img class="rt-hero-image" src="${safeText(itinerary.coverImage)}" alt="${safeText(itinerary.title)}" />`
          : '<div class="rt-hero-image rt-hero-image-placeholder"></div>'
      }
      <div class="rt-hero-content">
        <p class="rt-kicker">RouteIt • Exportación PDF</p>
        <h1>${safeText(itinerary.title)}</h1>
        <p class="rt-date">${safeText(itinerary.dateRange)}</p>
        <p class="rt-intro">${safeText(stripHtml(itinerary.intro))}</p>
        <div class="rt-stat-grid">
          <div class="rt-stat"><span>Días</span><strong>${itinerary.days.length}</strong></div>
          <div class="rt-stat"><span>Ciudades</span><strong>${itinerary.locations.length}</strong></div>
          <div class="rt-stat"><span>Vuelos</span><strong>${flightsCount}</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderOverviewSection(itinerary: TravelItinerary): string {
  return `
    <section class="rt-section">
      ${sectionTitle('Resumen del viaje', 'Vista global para revisar el plan completo de un vistazo.')}
      <div class="rt-grid rt-grid-3">
        <article class="rt-tile">
          <h3>Ruta principal</h3>
          <p>${safeText(itinerary.route.join(' → ') || 'Sin ruta definida')}</p>
        </article>
        <article class="rt-tile">
          <h3>Ubicaciones</h3>
          <ul>
            ${itinerary.locations.slice(0, 8).map(location => `<li>${safeText(location.label)}</li>`).join('')}
          </ul>
        </article>
        <article class="rt-tile">
          <h3>Notas iniciales</h3>
          <p>${safeText(stripHtml(itinerary.intro) || 'Sin descripción')}</p>
        </article>
      </div>
    </section>
  `;
}

function renderFlightInfoSection(itinerary: TravelItinerary): string {
  const modernFlights = itinerary.flightsList ?? [];
  if (modernFlights.length > 0) {
    return `
      <section class="rt-section">
        ${sectionTitle('Información de vuelos', `${modernFlights.length} vuelo(s) configurado(s).`)}
        <div class="rt-stack">
          ${modernFlights
            .map(flight => {
              const stops = typeof flight.stops === 'number' ? flight.stops : Math.max(0, flight.segments.length - 1);
              const route = flight.segments
                .map(segment => `${safeText(segment.departureAirport)} → ${safeText(segment.arrivalAirport)}`)
                .join(' · ');
              const firstSegment = flight.segments[0];
              return `
                <article class="rt-flight-card">
                  <div class="rt-flight-top">
                    <strong>${safeText(flight.label || 'Vuelo')}</strong>
                    <span>${safeText(flight.date)}</span>
                  </div>
                  <p>${route || 'Sin segmentos'}</p>
                  <p>
                    ${firstSegment ? `${safeText(firstSegment.departureCity)} → ${safeText(firstSegment.arrivalCity)}` : ''}
                    ${flight.totalDuration ? ` · ${safeText(flight.totalDuration)}` : ''}
                    · ${stops} escala(s)
                  </p>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }

  const legacyFlights = itinerary.flights;
  if (!legacyFlights?.outbound && !legacyFlights?.inbound) {
    return '';
  }

  const legacyRow = (label: string, flight?: TravelItinerary['flights']['outbound']) => {
    if (!flight) return '';
    return `
      <article class="rt-flight-card">
        <div class="rt-flight-top">
          <strong>${safeText(label)}</strong>
          <span>${safeText(flight.date)}</span>
        </div>
        <p>${safeText(flight.fromCity)} (${safeText(flight.fromTime)}) → ${safeText(flight.toCity)} (${safeText(flight.toTime)})</p>
        <p>Duración: ${safeText(flight.duration)} · Escalas: ${safeText(flight.stops)}</p>
      </article>
    `;
  };

  return `
    <section class="rt-section">
      ${sectionTitle('Información de vuelos')}
      <div class="rt-stack">
        ${legacyRow('Ida', legacyFlights?.outbound)}
        ${legacyRow('Vuelta', legacyFlights?.inbound)}
      </div>
    </section>
  `;
}

function renderItinerarySection(itinerary: TravelItinerary): string {
  return `
    <section class="rt-section">
      ${sectionTitle('Itinerario completo', 'Incluye todos los días para evitar perder información al exportar.')}
      <div class="rt-stack">
        ${itinerary.days
          .map(day => {
            const notes = day.notes.length
              ? `<div class="rt-notes">${day.notes.map(note => `<span>${safeText(note)}</span>`).join('')}</div>`
              : '<p class="rt-muted">Sin notas adicionales.</p>';

            return `
              <article class="rt-day-card">
                <header class="rt-day-header">
                  <div>
                    <p class="rt-day-chip">${safeText(day.dayLabel)} · ${safeText(day.kind)}</p>
                    <h3>${safeText(day.city)}</h3>
                  </div>
                  <span>${safeText(day.date)}</span>
                </header>
                <p class="rt-day-plan">${safeText(day.plan)}</p>
                <ul class="rt-schedule">
                  ${day.schedule
                    .map(item => {
                      const cost = typeof item.cost === 'number' ? ` · ${safeText(item.costCurrency || '€')}${item.cost.toFixed(2)}` : '';
                      return `<li><strong>${safeText(item.time || '--:--')}</strong><span>${safeText(item.activity)}${cost}</span></li>`;
                    })
                    .join('')}
                </ul>
                ${notes}
              </article>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
}

function renderMapSection(itinerary: TravelItinerary): string {
  const locations = itinerary.locations;
  if (locations.length === 0) {
    return '';
  }

  return `
    <section class="rt-section">
      ${sectionTitle('Mapa y ubicaciones', 'Listado de puntos clave con coordenadas para referencia rápida.')}
      <div class="rt-grid rt-grid-2">
        ${locations
          .map(
            location => `
              <article class="rt-location-card">
                <h3>${safeText(location.label)}</h3>
                <p>${safeText(location.city)}</p>
                <p>Lat: ${location.lat.toFixed(4)} · Lng: ${location.lng.toFixed(4)}</p>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderListsSection(itinerary: TravelItinerary): string {
  const groups = [
    { title: 'Comidas típicas', items: itinerary.foods },
    { title: 'Consejos', items: itinerary.tips },
    { title: 'Cosas a evitar', items: itinerary.avoid },
    { title: 'Utilidades', items: itinerary.utilities },
    { title: 'Checklist de maleta', items: itinerary.packing },
    { title: 'Dinero y pagos', items: itinerary.money },
    { title: 'Conectividad', items: itinerary.connectivity },
    { title: 'Transporte', items: itinerary.transport },
    { title: 'Seguridad', items: itinerary.safety },
    { title: 'Etiqueta local', items: itinerary.etiquette },
    { title: 'Clima', items: itinerary.weather },
    { title: 'Estafas comunes', items: itinerary.scams },
    { title: 'Emergencias', items: itinerary.emergency },
  ].filter(group => group.items.length > 0);

  if (groups.length === 0) return '';

  return `
    <section class="rt-section">
      ${sectionTitle('Listas útiles')}
      <div class="rt-grid rt-grid-2">
        ${groups
          .map(
            group => `
              <article class="rt-list-card">
                <h3>${safeText(group.title)}</h3>
                <ul>
                  ${group.items.map(item => `<li>${safeText(item)}</li>`).join('')}
                </ul>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderBudgetSection(itinerary: TravelItinerary): string {
  const tiers = itinerary.budgetTiers ?? [];
  const tips = itinerary.budgetTips ?? [];
  if (tiers.length === 0 && tips.length === 0) return '';

  return `
    <section class="rt-section">
      ${sectionTitle('Presupuesto')}
      <div class="rt-grid rt-grid-2">
        <article class="rt-list-card">
          <h3>Niveles diarios</h3>
          <ul>
            ${tiers.map(tier => `<li>${safeText(tier.label)}: €${tier.daily.toFixed(2)}/día</li>`).join('')}
          </ul>
        </article>
        <article class="rt-list-card">
          <h3>Tips de ahorro</h3>
          <ul>
            ${tips.map(tip => `<li>${safeText(tip)}</li>`).join('')}
          </ul>
        </article>
      </div>
    </section>
  `;
}

function renderPhrasesSection(itinerary: TravelItinerary): string {
  const phrases = itinerary.phrases ?? [];
  if (phrases.length === 0) return '';

  return `
    <section class="rt-section">
      ${sectionTitle('Frases útiles')}
      <table class="rt-table">
        <thead>
          <tr>
            <th>Español</th>
            <th>Pinyin</th>
            <th>Chino</th>
          </tr>
        </thead>
        <tbody>
          ${phrases
            .map(
              phrase => `
                <tr>
                  <td>${safeText(phrase.spanish)}</td>
                  <td>${safeText(phrase.pinyin)}</td>
                  <td>${safeText(phrase.chinese)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
}

function buildPrintableHtml(itinerary: TravelItinerary, options: PDFExportOptions): string {
  const isBooklet = options.visualStyle === 'booklet';
  const selectedLabels = getSelectedSectionLabels(options);
  const sections: string[] = [];

  if (isBooklet) {
    sections.push(renderBookletCover(itinerary, selectedLabels));
  }

  if (options.sections.flights) {
    sections.push(renderHeaderSection(itinerary));
    sections.push(renderFlightInfoSection(itinerary));
  }
  if (options.sections.overview) {
    sections.push(renderOverviewSection(itinerary));
  }
  if (options.sections.itinerary) {
    sections.push(renderItinerarySection(itinerary));
  }
  if (options.sections.map && options.includeMap) {
    sections.push(renderMapSection(itinerary));
  }
  if (options.sections.lists) {
    sections.push(renderListsSection(itinerary));
  }
  if (options.sections.budget) {
    sections.push(renderBudgetSection(itinerary));
  }
  if (options.sections.phrases) {
    sections.push(renderPhrasesSection(itinerary));
  }

  if (isBooklet) {
    sections.push(renderBookletClosing(itinerary));
  }

  return `
    <div class="rt-pdf-root ${isBooklet ? 'rt-booklet' : 'rt-standard'}">
      <style>
        .rt-pdf-root {
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        .rt-hero {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 18px;
          page-break-inside: avoid;
        }
        .rt-hero-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
          background: #e2e8f0;
        }
        .rt-hero-image-placeholder {
          background: linear-gradient(120deg, #dbeafe, #e2e8f0);
        }
        .rt-hero-content {
          padding: 18px;
        }
        .rt-kicker {
          margin: 0 0 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #334155;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.15;
        }
        .rt-date {
          margin: 8px 0 0;
          color: #475569;
          font-weight: 600;
        }
        .rt-intro {
          margin: 12px 0 0;
          color: #334155;
          line-height: 1.45;
        }
        .rt-stat-grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .rt-stat {
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          padding: 10px;
          background: #f8fafc;
        }
        .rt-stat span {
          display: block;
          font-size: 12px;
          color: #475569;
        }
        .rt-stat strong {
          font-size: 20px;
          line-height: 1.2;
        }
        .rt-section {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          margin: 18px 0;
          padding: 14px;
          page-break-inside: auto;
        }
        .rt-section-header h2 {
          margin: 0;
          font-size: 20px;
        }
        .rt-section-header p {
          margin: 5px 0 0;
          color: #475569;
          font-size: 13px;
        }
        .rt-grid {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }
        .rt-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .rt-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .rt-tile, .rt-list-card, .rt-location-card, .rt-flight-card {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 10px;
          background: #f8fafc;
          page-break-inside: avoid;
        }
        .rt-tile h3, .rt-list-card h3, .rt-location-card h3 {
          margin: 0 0 6px;
          font-size: 14px;
        }
        .rt-tile p, .rt-list-card li, .rt-location-card p, .rt-flight-card p {
          margin: 0;
          color: #334155;
          font-size: 12px;
          line-height: 1.4;
        }
        .rt-list-card ul, .rt-tile ul {
          margin: 0;
          padding-left: 16px;
          display: grid;
          gap: 4px;
        }
        .rt-stack {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }
        .rt-flight-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          font-size: 12px;
        }
        .rt-day-card {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px;
          page-break-inside: avoid;
          background: #ffffff;
        }
        .rt-day-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .rt-day-header h3 {
          margin: 4px 0 0;
          font-size: 16px;
        }
        .rt-day-header span {
          color: #475569;
          font-size: 11px;
          font-weight: 600;
        }
        .rt-day-chip {
          margin: 0;
          display: inline-block;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 3px 8px;
          background: #f8fafc;
          font-size: 11px;
          font-weight: 600;
        }
        .rt-day-plan {
          margin: 10px 0 0;
          color: #334155;
          font-size: 13px;
        }
        .rt-schedule {
          list-style: none;
          margin: 10px 0 0;
          padding: 0;
          display: grid;
          gap: 6px;
        }
        .rt-schedule li {
          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 12px;
        }
        .rt-schedule strong {
          color: #0f172a;
        }
        .rt-notes {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .rt-notes span {
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          color: #334155;
          background: #f8fafc;
        }
        .rt-muted {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .rt-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 12px;
        }
        .rt-table th, .rt-table td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .rt-table th {
          background: #e2e8f0;
        }
        .rt-booklet {
          background: #f8f6f2;
          color: #2a241d;
        }
        .rt-booklet .rt-section,
        .rt-booklet .rt-day-card,
        .rt-booklet .rt-list-card,
        .rt-booklet .rt-location-card,
        .rt-booklet .rt-flight-card,
        .rt-booklet .rt-tile {
          background: #fffdf8;
          border-color: #d9cdbf;
        }
        .rt-booklet .rt-section {
          border-width: 1px;
          border-radius: 10px;
          margin: 16px 0;
          page-break-inside: avoid;
        }
        .rt-booklet .rt-day-card {
          border-left: 4px solid #a47d4f;
          box-shadow: inset 0 0 0 1px #efe4d7;
        }
        .rt-booklet .rt-day-chip,
        .rt-booklet .rt-notes span,
        .rt-booklet .rt-stat {
          background: #f5eee4;
          border-color: #ccb394;
          color: #4c3f30;
        }
        .rt-booklet .rt-table th,
        .rt-booklet .rt-table td {
          border-color: #cbb79b;
        }
        .rt-booklet .rt-table th {
          background: #ece1d2;
        }
        .rt-booklet-cover {
          border: 1px solid #d1b994;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(165deg, #fff7ec 0%, #f3e6d5 100%);
          page-break-inside: avoid;
          margin-bottom: 18px;
        }
        .rt-booklet-cover-inner {
          padding: 22px;
          border-bottom: 1px dashed #c8ab86;
        }
        .rt-booklet-route {
          margin-top: 14px;
          border: 1px solid #dcc5a7;
          border-radius: 10px;
          background: #fffdf8;
          padding: 10px;
        }
        .rt-booklet-route strong {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #715737;
        }
        .rt-booklet-route p {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .rt-booklet-meta {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rt-booklet-meta span {
          border-radius: 999px;
          border: 1px solid #ccb394;
          padding: 3px 10px;
          background: #fdf5e7;
          font-size: 11px;
          font-weight: 600;
        }
        .rt-booklet-toc {
          padding: 16px 22px 22px;
        }
        .rt-booklet-toc h3 {
          margin: 0;
          font-size: 16px;
        }
        .rt-booklet-toc ol {
          margin: 10px 0 0;
          padding-left: 18px;
          display: grid;
          gap: 5px;
          font-size: 13px;
        }
        .rt-booklet-closing {
          border: 1px solid #d1b994;
          border-radius: 12px;
          background: linear-gradient(180deg, #fffaf1 0%, #f6ebdc 100%);
          padding: 16px;
          margin-top: 16px;
          page-break-before: always;
        }
        .rt-booklet-closing h2 {
          margin: 0;
          font-size: 22px;
        }
        .rt-booklet-closing > p {
          margin: 8px 0 0;
          font-size: 13px;
          color: #5a4a37;
        }
        .rt-booklet-closing-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .rt-booklet-closing-grid article {
          border: 1px solid #d8c3a8;
          border-radius: 10px;
          background: #fffdf8;
          padding: 10px;
        }
        .rt-booklet-closing-grid h3 {
          margin: 0 0 6px;
          font-size: 14px;
        }
        .rt-booklet-closing-grid ul {
          margin: 0;
          padding-left: 16px;
          display: grid;
          gap: 4px;
          font-size: 12px;
          color: #4b3d2d;
        }
      </style>
      ${sections.filter(Boolean).join('')}
    </div>
  `;
}

export async function exportItineraryToPDF(
  itinerary: TravelItinerary,
  _containerElement: HTMLElement,
  options: Partial<PDFExportOptions> = {},
): Promise<void> {
  const opts: PDFExportOptions = {
    ...defaultOptions,
    ...options,
    sections: {
      ...defaultOptions.sections,
      ...(options.sections ?? {}),
    },
  };
  const { format, orientation } = opts;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const someSectionSelected = Object.values(opts.sections).some(Boolean);
  if (!someSectionSelected) {
    throw new Error('Selecciona al menos una sección para exportar.');
  }

  const printableHtml = buildPrintableHtml(itinerary, opts);
  const mountNode = document.createElement('div');
  mountNode.style.position = 'fixed';
  mountNode.style.left = 'calc(100vw + 40px)';
  mountNode.style.top = '0';
  mountNode.style.width = opts.visualStyle === 'booklet'
    ? orientation === 'portrait' ? '960px' : '1320px'
    : orientation === 'portrait' ? '980px' : '1400px';
  mountNode.style.maxHeight = 'none';
  mountNode.style.overflow = 'visible';
  mountNode.style.background = '#ffffff';
  mountNode.style.opacity = '1';
  mountNode.style.zIndex = '2147483647';
  mountNode.style.pointerEvents = 'none';
  mountNode.setAttribute('aria-hidden', 'true');
  mountNode.innerHTML = printableHtml;
  document.body.appendChild(mountNode);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    if (opts.visualStyle === 'standard') {
      const renderWidth = Math.max(mountNode.scrollWidth, mountNode.offsetWidth, 800);
      const renderHeight = Math.max(mountNode.scrollHeight, mountNode.offsetHeight, 1000);

      const canvas = await html2canvas(mountNode, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: renderWidth,
        height: renderHeight,
        windowWidth: renderWidth,
        windowHeight: renderHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    } else {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('La generación del PDF está tardando demasiado.'));
        }, 60000);

        pdf.html(mountNode, {
          margin: [10, 10, 10, 10],
          autoPaging: 'text',
          html2canvas: {
            useCORS: true,
            scale: 1,
            logging: false,
            backgroundColor: '#ffffff',
          },
          callback: () => {
            window.clearTimeout(timeoutId);
            resolve();
          },
        });
      });
    }

    const styleSuffix = opts.visualStyle === 'booklet' ? '_cuadernillo' : '';
    const filename = `${itinerary.title.replace(/[^a-z0-9]/gi, '_')}${styleSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('No se pudo generar el PDF. Por favor, inténtalo de nuevo.');
  } finally {
    mountNode.remove();
  }
}

export async function captureMapAsImage(mapContainer: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(mapContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing map:', error);
    throw new Error('No se pudo capturar el mapa.');
  }
}
