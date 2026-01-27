import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TravelItinerary } from '../data/itinerary';

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
};

export async function exportItineraryToPDF(
  itinerary: TravelItinerary,
  containerElement: HTMLElement,
  options: Partial<PDFExportOptions> = {},
): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const { format, orientation } = opts;

  // Create PDF with specified format
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  // Get all sections to include
  const sectionsToInclude = Object.entries(opts.sections)
    .filter(([_, include]) => include)
    .map(([key]) => key);

  try {
    // Hide sections that shouldn't be included
    const allSections = containerElement.querySelectorAll('[data-section]');
    allSections.forEach((section) => {
      const sectionName = section.getAttribute('data-section');
      if (sectionName && !sectionsToInclude.includes(sectionName)) {
        (section as HTMLElement).style.display = 'none';
      }
    });

    // Hide no-print elements
    const noPrintElements = containerElement.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // Capture the main content
    const canvas = await html2canvas(containerElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    // Restore hidden sections
    allSections.forEach((section) => {
      (section as HTMLElement).style.display = '';
    });
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });

    // Generate filename
    const filename = `${itinerary.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('No se pudo generar el PDF. Por favor, inténtalo de nuevo.');
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
