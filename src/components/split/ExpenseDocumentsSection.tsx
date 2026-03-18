import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DocumentPreviewModal } from '../DocumentPreviewModal';
import { useToast } from '../../hooks/useToast';
import {
  createExpenseDocument,
  deleteExpenseDocument,
  listExpenseDocuments,
  updateExpenseDocument,
  type ExpenseDocument,
  type ExpenseDocumentType,
} from '../../services/expenseDocuments';
import {
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_DOCUMENT_MIME_TYPES,
  isAllowedDocumentValue,
  isBase64Document,
} from '../../utils/documentPreview';

type ExpenseDocumentsSectionProps = {
  expenseId: string;
  editable?: boolean;
};

type DocumentFormState = {
  type: ExpenseDocumentType;
  title: string;
  subtitle: string;
  reference: string;
  url: string;
};

const EMPTY_FORM: DocumentFormState = {
  type: 'other',
  title: '',
  subtitle: '',
  reference: '',
  url: '',
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const DOCUMENT_TYPES: Array<{ value: ExpenseDocumentType; label: string }> = [
  { value: 'receipt', label: 'Recibo' },
  { value: 'invoice', label: 'Factura' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'other', label: 'Otro' },
];

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

const getDocumentIcon = (type: ExpenseDocumentType) => {
  switch (type) {
    case 'receipt':
      return '🧾';
    case 'invoice':
      return '📄';
    case 'ticket':
      return '🎫';
    default:
      return '📎';
  }
};

export function ExpenseDocumentsSection({ expenseId, editable = false }: ExpenseDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ExpenseDocument[]>([]);
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

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await listExpenseDocuments(expenseId);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading expense documents:', error);
      showError('No se pudieron cargar los documentos del gasto');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [expenseId]);

  const openCreateDialog = () => {
    setEditingDocumentId(null);
    setForm(EMPTY_FORM);
    setSelectedFileName('');
    setIsDialogOpen(true);
  };

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingDocumentId(null);
    setForm(EMPTY_FORM);
    setSelectedFileName('');
  };

  const openEditDialog = (document: ExpenseDocument) => {
    setEditingDocumentId(document.id);
    setForm({
      type: document.type,
      title: document.title,
      subtitle: document.subtitle ?? '',
      reference: document.reference ?? '',
      url: document.url,
    });
    setSelectedFileName(getFileLabel(document.url));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving || isEncodingFile) return;
    resetDialogState();
  };

  const handleOpenDocument = (document: Pick<ExpenseDocument, 'title' | 'url'>) => {
    try {
      const trimmedUrl = document.url.trim();
      if (!trimmedUrl) {
        showError('El documento no tiene un archivo o enlace válido');
        return;
      }

      setPreviewDocument({ title: document.title, url: trimmedUrl });
    } catch (error) {
      console.error('Error opening expense document:', error);
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
    const isAllowedByType = SUPPORTED_DOCUMENT_MIME_TYPES.includes(
      mimeType as (typeof SUPPORTED_DOCUMENT_MIME_TYPES)[number],
    );
    const isAllowedByExt = SUPPORTED_DOCUMENT_EXTENSIONS.includes(
      extension as (typeof SUPPORTED_DOCUMENT_EXTENSIONS)[number],
    );

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
      console.error('Error encoding expense document as base64:', error);
      showError('No se pudo procesar el archivo');
    } finally {
      setIsEncodingFile(false);
    }
  };

  const handleSubmit = async () => {
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
        const updated = await updateExpenseDocument(editingDocument.id, {
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          url,
        });

        setDocuments(prev => prev.map(doc => (doc.id === updated.id ? updated : doc)));
        success('Documento actualizado');
      } else {
        const created = await createExpenseDocument({
          expenseId,
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          url,
        });

        setDocuments(prev => [created, ...prev]);
        success('Documento añadido');
      }

      resetDialogState();
    } catch (error) {
      console.error('Error saving expense document:', error);
      showError('No se pudo guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (doc: ExpenseDocument) => {
    if (!editable) return;

    const confirmed = window.confirm(`¿Eliminar "${doc.title}"?`);
    if (!confirmed) return;

    try {
      await deleteExpenseDocument(doc.id);
      setDocuments(prev => prev.filter(item => item.id !== doc.id));
      success('Documento eliminado');
    } catch (error) {
      console.error('Error deleting expense document:', error);
      showError('No se pudo eliminar el documento');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium">Documentos del gasto</label>
        {editable && (
          <Button size="sm" variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir documento
          </Button>
        )}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">Cargando documentos...</CardContent>
        </Card>
      )}

      {!isLoading && documents.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Este gasto todavía no tiene documentos adjuntos.
          </CardContent>
        </Card>
      )}

      {!isLoading && documents.length > 0 && (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    <span className="mr-2">{getDocumentIcon(doc.type)}</span>
                    {doc.title}
                  </p>
                  {doc.subtitle && <p className="text-xs text-muted-foreground mt-1">{doc.subtitle}</p>}
                  {doc.reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ref: <span className="font-medium text-foreground">{doc.reference}</span>
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {DOCUMENT_TYPES.find(item => item.value === doc.type)?.label ?? 'Documento'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDocument(doc)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
                {editable && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(doc)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(doc)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Editar documento del gasto' : 'Añadir documento al gasto'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="expense-doc-type" className="text-sm font-medium">
                Tipo
              </label>
              <select
                id="expense-doc-type"
                value={form.type}
                onChange={event => setForm(prev => ({ ...prev, type: event.target.value as ExpenseDocumentType }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="expense-doc-title" className="text-sm font-medium">
                Título
              </label>
              <input
                id="expense-doc-title"
                type="text"
                value={form.title}
                onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                placeholder="Ej: Ticket taxi aeropuerto"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expense-doc-subtitle" className="text-sm font-medium">
                Subtítulo
              </label>
              <input
                id="expense-doc-subtitle"
                type="text"
                value={form.subtitle}
                onChange={event => setForm(prev => ({ ...prev, subtitle: event.target.value }))}
                placeholder="Opcional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expense-doc-reference" className="text-sm font-medium">
                Referencia
              </label>
              <input
                id="expense-doc-reference"
                type="text"
                value={form.reference}
                onChange={event => setForm(prev => ({ ...prev, reference: event.target.value }))}
                placeholder="Factura #, localizador, etc."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Archivo</label>
              <input
                id="expense-doc-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFilePicked}
                className="sr-only"
                disabled={isEncodingFile || isSaving}
              />

              <label
                htmlFor="expense-doc-file-input"
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
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, JPG, PNG, WEBP. Máximo {formatBytes(MAX_FILE_SIZE_BYTES)}.
                </p>
              </label>

              {isEncodingFile && <p className="text-xs text-muted-foreground">Procesando archivo...</p>}

              {form.url && (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
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
