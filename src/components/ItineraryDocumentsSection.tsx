import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ExternalLink, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { useToast } from '../hooks/useToast';
import {
  createItineraryDocument,
  deleteItineraryDocument,
  listItineraryDocuments,
  updateItineraryDocument,
  type ItineraryDocument,
  type ItineraryDocumentType,
} from '../services/documents';
import { isBase64Document, isAllowedDocumentValue } from '../utils/documentPreview';

type ItineraryDocumentsSectionProps = {
  itineraryId?: string;
  editable?: boolean;
};

type DocumentFormState = {
  type: ItineraryDocumentType;
  title: string;
  subtitle: string;
  reference: string;
  expiryDate: string;
  url: string;
};

const EMPTY_FORM: DocumentFormState = {
  type: 'other',
  title: '',
  subtitle: '',
  reference: '',
  expiryDate: '',
  url: '',
};

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const DOCUMENT_TYPES: Array<{ value: ItineraryDocumentType; label: string }> = [
  { value: 'passport', label: 'Pasaporte' },
  { value: 'flight', label: 'Billete de avión' },
  { value: 'hotel', label: 'Reserva de hotel' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'other', label: 'Otro' },
];

const getDocumentIcon = (type: ItineraryDocumentType) => {
  switch (type) {
    case 'passport':
      return '📄';
    case 'flight':
      return '✈️';
    case 'hotel':
      return '🏨';
    case 'insurance':
      return '🛡️';
    default:
      return '📎';
  }
};

const getExpiryWarning = (expiryDate?: string | null) => {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { text: 'Expirado', color: 'text-red-600 dark:text-red-400' };
  }

  if (daysUntilExpiry < 90) {
    return { text: `Expira en ${daysUntilExpiry} días`, color: 'text-orange-600 dark:text-orange-400' };
  }

  return { text: `Expira: ${expiry.toLocaleDateString('es-ES')}`, color: 'text-mutedForeground' };
};

const fileToBase64DataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer el archivo'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileLabel = (url: string) => {
  if (isBase64Document(url)) {
    return 'documento-base64';
  }

  const fallback = url.split('/').pop() ?? 'documento';
  try {
    return decodeURIComponent(fallback);
  } catch {
    return fallback;
  }
};

function ItineraryDocumentsSection({ itineraryId, editable = false }: ItineraryDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ItineraryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEncodingFile, setIsEncodingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentFormState>(EMPTY_FORM);
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null);
  const { success, error: showError } = useToast();

  const editingDocument = useMemo(
    () => documents.find(doc => doc.id === editingDocumentId) ?? null,
    [documents, editingDocumentId],
  );

  const loadDocuments = useCallback(async () => {
    if (!itineraryId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await listItineraryDocuments(itineraryId);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading itinerary documents:', error);
      showError('No se pudieron cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  }, [itineraryId, showError]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const openCreateDialog = () => {
    setEditingDocumentId(null);
    setForm(EMPTY_FORM);
    setSelectedFileName('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (document: ItineraryDocument) => {
    setEditingDocumentId(document.id);
    setForm({
      type: document.type,
      title: document.title,
      subtitle: document.subtitle ?? '',
      reference: document.reference ?? '',
      expiryDate: document.expiry_date ?? '',
      url: document.url,
    });
    setSelectedFileName(getFileLabel(document.url));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving || isEncodingFile) return;
    setIsDialogOpen(false);
    setEditingDocumentId(null);
    setForm(EMPTY_FORM);
    setSelectedFileName('');
  };

  const handleOpenDocument = (document: Pick<ItineraryDocument, 'title' | 'url'>) => {
    try {
      const trimmedUrl = document.url.trim();
      if (!trimmedUrl) {
        showError('El documento no tiene un archivo o enlace válido');
        return;
      }

      setPreviewDocument({ title: document.title, url: trimmedUrl });
    } catch (error) {
      console.error('Error opening document:', error);
      showError('No se pudo abrir el documento');
    }
  };

  const handleFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showError(`Archivo demasiado grande. Máximo ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
      return;
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : '';
    const mimeType = file.type.toLowerCase();
    const isAllowedByType = ALLOWED_MIME_TYPES.includes(mimeType);
    const isAllowedByExt = ALLOWED_EXTENSIONS.includes(extension);

    if (!isAllowedByType && !isAllowedByExt) {
      showError('Formato no permitido. Usa PDF, JPG, PNG o WEBP');
      return;
    }

    setIsEncodingFile(true);
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      if (!isAllowedDocumentValue(dataUrl)) {
        showError('No se pudo validar el archivo seleccionado');
        return;
      }

      setForm(prev => ({ ...prev, url: dataUrl }));
      setSelectedFileName(file.name);
      success('Documento preparado en base64');
    } catch (error) {
      console.error('Error encoding document as base64:', error);
      showError('No se pudo procesar el archivo');
    } finally {
      setIsEncodingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!itineraryId) {
      showError('Guarda primero tu itinerario para gestionar documentos');
      return;
    }

    const title = form.title.trim();
    const url = form.url.trim();

    if (!title) {
      showError('El título es obligatorio');
      return;
    }

    if (!url) {
      showError('Añade un archivo o una URL antes de guardar');
      return;
    }

    if (!isAllowedDocumentValue(url)) {
      showError('Formato no permitido. Usa PDF, JPG, PNG o WEBP');
      return;
    }

    setIsSaving(true);
    try {
      if (editingDocument) {
        const updated = await updateItineraryDocument(editingDocument.id, {
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          expiryDate: form.expiryDate,
          url,
        });

        setDocuments(prev => prev.map(doc => (doc.id === updated.id ? updated : doc)));
        success('Documento actualizado');
      } else {
        const created = await createItineraryDocument({
          itineraryId,
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          expiryDate: form.expiryDate,
          url,
        });

        setDocuments(prev => [created, ...prev]);
        success('Documento añadido');
      }

      closeDialog();
    } catch (error) {
      console.error('Error saving document:', error);
      showError('No se pudo guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (document: ItineraryDocument) => {
    if (!editable) return;

    const confirmed = window.confirm(`¿Eliminar "${document.title}"?`);
    if (!confirmed) return;

    try {
      await deleteItineraryDocument(document.id);
      setDocuments(prev => prev.filter(item => item.id !== document.id));
      success('Documento eliminado');
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('No se pudo eliminar el documento');
    }
  };

  const canManage = editable && Boolean(itineraryId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mutedForeground">
          Guarda billetes, reservas y pólizas para tenerlos a mano durante el viaje.
        </p>
        {canManage && (
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir documento
          </Button>
        )}
      </div>

      {!itineraryId && (
        <Card>
          <CardContent className="pt-6 text-sm text-mutedForeground">
            Guarda el itinerario para habilitar la gestión de documentos.
          </CardContent>
        </Card>
      )}

      {itineraryId && isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-mutedForeground">Cargando documentos...</CardContent>
        </Card>
      )}

      {itineraryId && !isLoading && documents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin documentos</CardTitle>
            <CardDescription>
              Aún no has añadido documentos importantes para este itinerario.
            </CardDescription>
          </CardHeader>
          {canManage && (
            <CardContent>
              <Button variant="outline" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir primer documento
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {itineraryId && !isLoading && documents.length > 0 && (
        <Card className="overflow-hidden border-border/70">
          <div className="md:hidden divide-y divide-border/70">
            {documents.map(document => {
              const expiryInfo = getExpiryWarning(document.expiry_date);
              const typeLabel = DOCUMENT_TYPES.find(item => item.value === document.type)?.label ?? 'Documento';

              return (
                <div key={document.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="mt-0.5 text-lg">{getDocumentIcon(document.type)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
                        {document.subtitle && (
                          <p className="mt-1 truncate text-xs text-mutedForeground">{document.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDocument(document)}
                        aria-label={`Abrir ${document.title}`}
                        title="Abrir"
                        className="h-8 w-8 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/15 dark:hover:text-sky-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(document)}
                            aria-label={`Editar ${document.title}`}
                            title="Editar"
                            className="h-8 w-8 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-500/15 dark:hover:text-amber-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(document)}
                            aria-label={`Eliminar ${document.title}`}
                            title="Eliminar"
                            className="h-8 w-8 text-red-700 hover:bg-red-100 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/15 dark:hover:text-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="font-semibold uppercase tracking-[0.12em] text-mutedForeground">Tipo</p>
                      <p className="mt-1 text-foreground">{typeLabel}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-[0.12em] text-mutedForeground">Referencia</p>
                      <p className="mt-1 truncate text-foreground">{document.reference ? document.reference : 'Sin ref.'}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-[0.12em] text-mutedForeground">Caducidad</p>
                      <div className="mt-1 min-w-0">
                        {expiryInfo ? (
                          <span className={`inline-flex max-w-full items-center gap-1.5 font-medium ${expiryInfo.color}`}>
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span className="truncate">{expiryInfo.text}</span>
                          </span>
                        ) : (
                          <span className="text-foreground">Sin fecha</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
                  <th className="px-4 py-3 text-left">Documento</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Referencia</th>
                  <th className="px-4 py-3 text-left">Caducidad</th>
                  <th className="px-4 py-3 text-right">Acc.</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(document => {
                  const expiryInfo = getExpiryWarning(document.expiry_date);
                  const typeLabel = DOCUMENT_TYPES.find(item => item.value === document.type)?.label ?? 'Documento';

                  return (
                    <tr key={document.id} className="border-b border-border/70 last:border-b-0 align-middle">
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 text-lg">{getDocumentIcon(document.type)}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
                            {document.subtitle && (
                              <p className="mt-1 truncate text-xs text-mutedForeground">{document.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-mutedForeground">{typeLabel}</td>
                      <td className="px-4 py-4 text-sm text-mutedForeground">
                        <span className="block truncate">{document.reference ? document.reference : 'Sin ref.'}</span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {expiryInfo ? (
                          <span className={`inline-flex max-w-full items-center gap-1.5 font-medium ${expiryInfo.color}`}>
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{expiryInfo.text}</span>
                          </span>
                        ) : (
                          <span className="text-mutedForeground">Sin fecha</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDocument(document)}
                            aria-label={`Abrir ${document.title}`}
                            title="Abrir"
                            className="h-8 w-8 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/15 dark:hover:text-sky-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(document)}
                                aria-label={`Editar ${document.title}`}
                                title="Editar"
                                className="h-8 w-8 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-500/15 dark:hover:text-amber-200"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(document)}
                                aria-label={`Eliminar ${document.title}`}
                                title="Eliminar"
                                className="h-8 w-8 text-red-700 hover:bg-red-100 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/15 dark:hover:text-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Editar documento' : 'Añadir documento'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="doc-type" className="text-sm font-medium">
                Tipo
              </label>
              <select
                id="doc-type"
                value={form.type}
                onChange={event => setForm(prev => ({ ...prev, type: event.target.value as ItineraryDocumentType }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="doc-expiry" className="text-sm font-medium">
                Fecha de expiración
              </label>
              <input
                id="doc-expiry"
                type="date"
                value={form.expiryDate}
                onChange={event => setForm(prev => ({ ...prev, expiryDate: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="doc-title" className="text-sm font-medium">
                Título
              </label>
              <input
                id="doc-title"
                type="text"
                value={form.title}
                onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                placeholder="Ej: Billete MAD-TOK 24/04"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="doc-subtitle" className="text-sm font-medium">
                Subtítulo
              </label>
              <input
                id="doc-subtitle"
                type="text"
                value={form.subtitle}
                onChange={event => setForm(prev => ({ ...prev, subtitle: event.target.value }))}
                placeholder="Opcional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="doc-reference" className="text-sm font-medium">
                Referencia
              </label>
              <input
                id="doc-reference"
                type="text"
                value={form.reference}
                onChange={event => setForm(prev => ({ ...prev, reference: event.target.value }))}
                placeholder="PNR / localizador"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Archivo</label>
              <input
                id="doc-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFilePicked}
                className="sr-only"
                disabled={isEncodingFile || isSaving}
              />

              <label
                htmlFor="doc-file-input"
                className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition ${
                  isEncodingFile || isSaving
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <Upload className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {selectedFileName || form.url ? 'Cambiar archivo' : 'Seleccionar archivo'}
                </p>
                <p className="text-xs text-mutedForeground">
                  Formatos permitidos: PDF, JPG, PNG, WEBP. Máximo {formatBytes(MAX_FILE_SIZE_BYTES)}.
                </p>
              </label>

              {isEncodingFile && <p className="text-xs text-mutedForeground">Procesando archivo...</p>}

              {form.url && (
                <p className="inline-flex items-center gap-2 text-xs text-mutedForeground">
                  <FileText className="h-3.5 w-3.5" />
                  Archivo seleccionado: {selectedFileName || getFileLabel(form.url)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || isEncodingFile}>
              {isSaving ? 'Guardando...' : editingDocument ? 'Guardar cambios' : 'Añadir documento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentPreviewModal
        open={Boolean(previewDocument)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDocument(null);
          }
        }}
        title={previewDocument?.title ?? 'Documento'}
        url={previewDocument?.url ?? null}
      />
    </div>
  );
}

export default ItineraryDocumentsSection;
