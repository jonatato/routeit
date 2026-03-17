import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs, type PDFDocumentProxy } from 'react-pdf';
import reactPdfWorkerSrc from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type IonicPdfPreviewProps = {
  file: string | File | ArrayBuffer;
};

pdfjs.GlobalWorkerOptions.workerSrc = reactPdfWorkerSrc;

export function IonicPdfPreview({ file }: IonicPdfPreviewProps) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | File | ArrayBuffer | null>(null);
  const [viewerWidth, setViewerWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const documentOptions = useMemo(
    () => ({
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
    }),
    [],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNumPages(0);

    if (file instanceof File) {
      const objectUrl = URL.createObjectURL(file);
      setFileUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setFileUrl(file);
  }, [file]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const updateWidth = () => {
      setViewerWidth(Math.max(Math.floor(container.clientWidth - 24), 280));
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleLoadSuccess = (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setLoading(false);
    setError(null);
  };

  const handleLoadError = (loadError: Error) => {
    console.error('Error loading PDF preview:', loadError);
    setLoading(false);
    setError(loadError.message || 'No se pudo cargar el PDF dentro de la app.');
  };

  const renderPage = (targetPage: number) => (
    <div
      key={`page_${targetPage}`}
      data-page-number={targetPage}
      className="pdf-page-wrapper"
    >
      <Page
        pageNumber={targetPage}
        width={viewerWidth || 280}
        renderTextLayer
        renderAnnotationLayer
        className="pdf-page-continuous"
      />
    </div>
  );

  return (
    <div className="routeit-pdf-viewer pdf-viewer-container">
      <div ref={contentRef} className="pdf-content-continuous">
        {loading && (
          <div className="pdf-loading-ionic">
            <div className="loading-spinner" />
            <p>Cargando PDF...</p>
          </div>
        )}

        {error && (
          <div className="pdf-viewer-error">
            <div className="error-content">
              <h3>Error al abrir el PDF</h3>
              <div className="error-message">{error}</div>
            </div>
          </div>
        )}

        {fileUrl && !error && (
          <Document
            file={fileUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            loading={null}
            options={documentOptions}
          >
            {numPages > 0 && (
              <div className="pdf-pages-container">
                {Array.from({ length: numPages }, (_, index) => renderPage(index + 1))}
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  );
}