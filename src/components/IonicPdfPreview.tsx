import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs, type PDFDocumentProxy } from 'react-pdf';
import reactPdfWorkerSrc from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type IonicPdfPreviewProps = {
  file: string | File | ArrayBuffer;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

pdfjs.GlobalWorkerOptions.workerSrc = reactPdfWorkerSrc;

export function IonicPdfPreview({ file }: IonicPdfPreviewProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | File | ArrayBuffer | null>(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [currentScrollMode, setCurrentScrollMode] = useState<'page' | 'continuous'>('continuous');
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
    setPageNumber(1);
    setCurrentVisiblePage(1);

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

  useEffect(() => {
    if (currentScrollMode !== 'continuous') return;

    const container = contentRef.current;
    const targetPage = container?.querySelector<HTMLElement>(`[data-page-number="${pageNumber}"]`);

    if (!container || !targetPage || pageNumber === currentVisiblePage) {
      return;
    }

    targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentScrollMode, currentVisiblePage, pageNumber]);

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

  const goToPrevPage = () => {
    setPageNumber(current => Math.max(current - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(current => Math.min(current + 1, numPages || 1));
  };

  const goToPage = (nextPage: number) => {
    setPageNumber(Math.min(Math.max(nextPage, 1), numPages || 1));
  };

  const zoomIn = () => {
    setScale(current => Math.min(Number((current + ZOOM_STEP).toFixed(2)), MAX_ZOOM));
  };

  const zoomOut = () => {
    setScale(current => Math.max(Number((current - ZOOM_STEP).toFixed(2)), MIN_ZOOM));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const toggleScrollMode = () => {
    setCurrentScrollMode(current => (current === 'page' ? 'continuous' : 'page'));
  };

  const handleScroll = () => {
    if (currentScrollMode !== 'continuous') return;

    const container = contentRef.current;
    if (!container) return;

    const pages = Array.from(container.querySelectorAll<HTMLElement>('[data-page-number]'));
    if (pages.length === 0) return;

    const containerTop = container.getBoundingClientRect().top;

    let nearestPage = currentVisiblePage;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const pageElement of pages) {
      const pageTop = pageElement.getBoundingClientRect().top;
      const distance = Math.abs(pageTop - containerTop);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = Number(pageElement.dataset.pageNumber || 1);
      }
    }

    if (nearestPage !== currentVisiblePage) {
      setCurrentVisiblePage(nearestPage);
      setPageNumber(nearestPage);
    }
  };

  const renderPage = (targetPage: number) => (
    <div
      key={`page_${targetPage}`}
      data-page-number={targetPage}
      className={`pdf-page-wrapper ${targetPage === currentVisiblePage ? 'current-page' : ''}`}
    >
      <Page
        pageNumber={targetPage}
        width={viewerWidth || 280}
        scale={scale}
        renderTextLayer
        renderAnnotationLayer
        className={currentScrollMode === 'continuous' ? 'pdf-page-continuous' : ''}
      />
    </div>
  );

  return (
    <div className="routeit-pdf-viewer pdf-viewer-container">
      <div className="pdf-controls-single-line">
        <div className="pdf-controls-group">
          <button className="pdf-control-btn" disabled={pageNumber <= 1} onClick={goToPrevPage} title="Página anterior">
            ‹
          </button>
          <span className="page-info-compact">{numPages > 0 ? `${pageNumber} / ${numPages}` : '...'}</span>
          <button
            className="pdf-control-btn"
            disabled={pageNumber >= (numPages || 1)}
            onClick={goToNextPage}
            title="Página siguiente"
          >
            ›
          </button>
        </div>

        <div className="page-input-compact">
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={pageNumber}
            onChange={(event) => goToPage(Number.parseInt(event.target.value, 10) || 1)}
            className="page-number-input"
            aria-label="Ir a página"
          />
        </div>

        <div className="pdf-controls-group">
          <button className="pdf-control-btn" disabled={scale <= MIN_ZOOM} onClick={zoomOut} title="Alejar">
            −
          </button>
          <span className="zoom-info-compact">{Math.round(scale * 100)}%</span>
          <button className="pdf-control-btn" disabled={scale >= MAX_ZOOM} onClick={zoomIn} title="Acercar">
            +
          </button>
          <button className="pdf-control-btn" onClick={resetZoom} title="Restablecer zoom">
            ⌂
          </button>
          <button className="pdf-control-btn" onClick={toggleScrollMode} title="Cambiar modo de visualización">
            {currentScrollMode === 'page' ? '≡' : '⎘'}
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        className={currentScrollMode === 'continuous' ? 'pdf-content-continuous' : 'pdf-content-ionic'}
        onScroll={currentScrollMode === 'continuous' ? handleScroll : undefined}
      >
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
            {numPages > 0 && currentScrollMode === 'page' && renderPage(pageNumber)}

            {numPages > 0 && currentScrollMode === 'continuous' && (
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