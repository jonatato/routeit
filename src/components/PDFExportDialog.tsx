import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { PDFExportOptions } from '../services/pdfExport';
import { useToast } from '../hooks/useToast';

type PDFExportDialogProps = {
  onExport: (options: PDFExportOptions) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
};

export function PDFExportDialog({ onExport, onCancel, isOpen }: PDFExportDialogProps) {
  const [options, setOptions] = useState<PDFExportOptions>({
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
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSectionToggle = (section: keyof typeof options.sections) => {
    setOptions({
      ...options,
      sections: {
        ...options.sections,
        [section]: !options.sections[section],
      },
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onCancel();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Exportar a PDF</CardTitle>
          <CardDescription>Selecciona las secciones que deseas incluir en el PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium">Secciones a incluir</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(options.sections).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleSectionToggle(key as keyof typeof options.sections)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm capitalize">
                    {key === 'overview' ? 'Resumen' : key === 'itinerary' ? 'Itinerario' : key === 'map' ? 'Mapa' : key === 'budget' ? 'Presupuesto' : key === 'lists' ? 'Listas' : key === 'phrases' ? 'Frases' : 'Vuelos'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Formato</label>
              <select
                value={options.format}
                onChange={e => setOptions({ ...options, format: e.target.value as 'A4' | 'Letter' })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Orientación</label>
              <select
                value={options.orientation}
                onChange={e => setOptions({ ...options, orientation: e.target.value as 'portrait' | 'landscape' })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="portrait">Vertical</option>
                <option value="landscape">Horizontal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeMap"
              checked={options.includeMap}
              onChange={e => setOptions({ ...options, includeMap: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="includeMap" className="text-sm cursor-pointer">
              Incluir mapa como imagen
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isExporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

