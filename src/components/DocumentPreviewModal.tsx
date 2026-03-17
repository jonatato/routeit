import { useEffect, useState } from 'react';
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import {
  base64ToBlob,
  isImageMimeType,
  isPdfMimeType,
  parseBase64DataUrl,
} from '../utils/documentPreview';

type DocumentPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string | null;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

export function DocumentPreviewModal({ open, onOpenChange, title, url }: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !url) {
      setPreviewUrl(null);
      setMimeType('');
      setError(null);
      setZoomLevel(1);
      return;
    }

    setZoomLevel(1);

    const parsed = parseBase64DataUrl(url);
    if (!parsed) {
      setPreviewUrl(null);
      setMimeType('');
      setError('El documento no tiene un formato válido.');
      return;
    }

    try {
      const blob = base64ToBlob(parsed.data, parsed.mimeType || 'application/octet-stream');
      const objectUrl = URL.createObjectURL(blob);

      setPreviewUrl(objectUrl);
      setMimeType(parsed.mimeType || 'application/octet-stream');
      setError(null);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } catch (previewError) {
      console.error('Error preparing document preview:', previewError);
      setPreviewUrl(null);
      setMimeType('');
      setError('No se pudo preparar la vista previa del documento.');
    }
  }, [open, url]);

  if (!url) return null;

  const isImage = Boolean(previewUrl && isImageMimeType(mimeType));
  const isPdf = Boolean(previewUrl && isPdfMimeType(mimeType));
  const canZoom = isImage || isPdf;
  const pdfPreviewUrl = previewUrl ? `${previewUrl}#zoom=${Math.round(zoomLevel * 100)}` : null;

  const handleZoomOut = () => {
    setZoomLevel(current => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    setZoomLevel(current => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-[120] bg-background">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 pt-[calc(var(--safe-area-inset-top)+0.75rem)] backdrop-blur">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h2>
              <p className="text-xs text-muted-foreground">Pulsa Cerrar o toca fuera para salir.</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {canZoom && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background/80 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= MIN_ZOOM}
                    aria-label="Reducir zoom"
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= MAX_ZOOM}
                    aria-label="Aumentar zoom"
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoomLevel(1)}
                    disabled={zoomLevel === 1}
                    aria-label="Restablecer zoom"
                    className="h-8 w-8"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="shrink-0"
                aria-label="Cerrar visor de documento"
              >
                <X className="mr-2 h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/15 px-2 py-2 pb-[calc(var(--safe-area-inset-bottom)+0.5rem)] sm:px-4 sm:py-4">
            {error ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : isImage ? (
              <div className="flex min-h-full items-center justify-center overflow-auto rounded-xl border border-border bg-background p-2 sm:p-4">
                <img
                  src={previewUrl!}
                  alt={title}
                  className="h-auto w-auto max-w-none object-contain transition-transform duration-150"
                  style={{
                    maxHeight: 'calc(100dvh - 8rem)',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            ) : isPdf ? (
              <iframe
                key={pdfPreviewUrl}
                src={pdfPreviewUrl!}
                title={title}
                className="h-full min-h-[calc(100dvh-7rem)] w-full rounded-xl border border-border bg-background"
              />
            ) : (
              <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                Este formato no se puede visualizar dentro de la app.
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}