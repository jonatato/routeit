import { useEffect, useState } from 'react';
import { Download, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { IonicPdfPreview } from './IonicPdfPreview';
import {
  base64ToBlob,
  detectRemoteMimeType,
  isImageMimeType,
  isRemoteDocumentUrl,
  isPdfMimeType,
  isSupportedDocumentMimeType,
  isBase64Document,
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

const getExtensionFromMimeType = (mimeType: string) => {
  switch (mimeType.toLowerCase()) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
};

const buildDownloadFileName = (title: string, mimeType: string) => {
  const safeTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeTitle || 'documento'}.${getExtensionFromMimeType(mimeType)}`;
};

export function DocumentPreviewModal({ open, onOpenChange, title, url }: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
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
      setDownloadUrl(null);
      setMimeType('');
      setError(null);
      setIsPreparing(false);
      setZoomLevel(1);
      return;
    }

    let objectUrl: string | null = null;
    const abortController = new AbortController();
    let disposed = false;

    setZoomLevel(1);
    setPreviewUrl(null);
    setDownloadUrl(null);
    setMimeType('');
    setError(null);
    setIsPreparing(true);

    const preparePreview = async () => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setError('El documento no tiene un formato válido.');
        setIsPreparing(false);
        return;
      }

      if (isBase64Document(trimmedUrl)) {
        const parsed = parseBase64DataUrl(trimmedUrl);
        if (!parsed || !isSupportedDocumentMimeType(parsed.mimeType)) {
          setError('El documento no tiene un formato válido.');
          setIsPreparing(false);
          return;
        }

        try {
          const blob = base64ToBlob(parsed.data, parsed.mimeType || 'application/octet-stream');
          objectUrl = URL.createObjectURL(blob);

          if (disposed) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          setPreviewUrl(objectUrl);
          setDownloadUrl(objectUrl);
          setMimeType(parsed.mimeType || 'application/octet-stream');
          setError(null);
        } catch (previewError) {
          console.error('Error preparing document preview:', previewError);
          setPreviewUrl(null);
          setDownloadUrl(null);
          setMimeType('');
          setError('No se pudo preparar la vista previa del documento.');
        } finally {
          if (!disposed) {
            setIsPreparing(false);
          }
        }

        return;
      }

      if (!isRemoteDocumentUrl(trimmedUrl)) {
        setError('El documento no tiene un formato válido.');
        setIsPreparing(false);
        return;
      }

      try {
        const resolvedMimeType = await detectRemoteMimeType(trimmedUrl, abortController.signal);

        if (disposed) {
          return;
        }

        if (!resolvedMimeType) {
          setPreviewUrl(null);
          setDownloadUrl(trimmedUrl);
          setMimeType('');
          setError('No se pudo identificar si el enlace apunta a un PDF o una imagen compatible.');
          return;
        }

        setPreviewUrl(trimmedUrl);
        setDownloadUrl(trimmedUrl);
        setMimeType(resolvedMimeType);

        if (!isPdfMimeType(resolvedMimeType) && !isImageMimeType(resolvedMimeType)) {
          setError('Este enlace no devuelve un PDF ni una imagen compatible.');
          return;
        }

        setError(null);
      } catch (previewError) {
        if (previewError instanceof DOMException && previewError.name === 'AbortError') {
          return;
        }

        console.error('Error loading remote document preview:', previewError);
        setPreviewUrl(null);
        setDownloadUrl(trimmedUrl);
        setMimeType('');
        setError('No se pudo cargar la vista previa del documento.');
      } finally {
        if (!disposed) {
          setIsPreparing(false);
        }
      }
    };

    void preparePreview();

    return () => {
      disposed = true;
      abortController.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, url]);

  const isImage = Boolean(previewUrl && isImageMimeType(mimeType));
  const isPdf = Boolean(previewUrl && isPdfMimeType(mimeType));

  const handleZoomOut = () => {
    setZoomLevel(current => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    setZoomLevel(current => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
  };

  const handleDownload = () => {
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = buildDownloadFileName(title, mimeType || 'application/octet-stream');
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!url) return null;

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!downloadUrl}
                className="shrink-0"
                aria-label="Descargar documento"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>

              {isImage && (
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
            {isPreparing ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p>Preparando vista previa del documento...</p>
              </div>
            ) : error ? (
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
              <div className="h-[calc(100dvh-7rem)] min-h-[calc(100dvh-7rem)] overflow-hidden rounded-xl border border-border bg-background">
                <IonicPdfPreview file={previewUrl!} />
              </div>
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