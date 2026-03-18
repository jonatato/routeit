import { useMemo, useState } from 'react';
import { FileText, Plus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { ScheduleItem } from '../data/itinerary';
import type {
  CreateItineraryDocumentInput,
  ItineraryDocument,
  ItineraryDocumentType,
} from '../services/documents';
import { POPULAR_CURRENCIES } from '../services/currency';
import { useToast } from '../hooks/useToast';
import {
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_DOCUMENT_MIME_TYPES,
  isAllowedDocumentValue,
} from '../utils/documentPreview';

type NewDocumentFormState = {
  type: ItineraryDocumentType;
  title: string;
  subtitle: string;
  reference: string;
  expiryDate: string;
  url: string;
};

const EMPTY_DOCUMENT_FORM: NewDocumentFormState = {
  type: 'other',
  title: '',
  subtitle: '',
  reference: '',
  expiryDate: '',
  url: '',
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

interface ActivityAdminMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem;
  onSave: (item: ScheduleItem) => Promise<boolean | void> | boolean | void;
  splitMembers?: Array<{ id: string; name: string }>;
  documents?: ItineraryDocument[];
  itineraryId?: string;
  onCreateDocument?: (input: CreateItineraryDocumentInput) => Promise<ItineraryDocument>;
  onManageDocuments?: () => void;
}

export function ActivityAdminMetaModal({
  isOpen,
  onClose,
  item,
  onSave,
  splitMembers = [],
  documents = [],
  itineraryId,
  onCreateDocument,
  onManageDocuments,
}: ActivityAdminMetaModalProps) {
  const [formData, setFormData] = useState<ScheduleItem>(item);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(documents.length === 0);
  const [newDocumentForm, setNewDocumentForm] = useState<NewDocumentFormState>(EMPTY_DOCUMENT_FORM);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isEncodingFile, setIsEncodingFile] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isSavingActivityMeta, setIsSavingActivityMeta] = useState(false);
  const { success, error: showError } = useToast();

  const selectedDocument = useMemo(
    () => documents.find(document => document.id === formData.documentId) ?? null,
    [documents, formData.documentId],
  );

  const splitHint =
    typeof formData.cost === 'number' && formData.cost > 0 && splitMembers.length > 0
      ? `${(formData.cost / splitMembers.length).toFixed(2)} ${formData.costCurrency ?? 'EUR'} por persona`
      : null;

  const handleSave = async () => {
    setIsSavingActivityMeta(true);
    try {
      const result = await onSave(formData);
      if (result !== false) {
        onClose();
      }
    } finally {
      setIsSavingActivityMeta(false);
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

      setNewDocumentForm(prev => ({ ...prev, url: dataUrl }));
      setSelectedFileName(file.name);
      success('Archivo preparado para el nuevo documento');
    } catch (error) {
      console.error('Error preparando archivo del documento:', error);
      showError('No se pudo procesar el archivo');
    } finally {
      setIsEncodingFile(false);
    }
  };

  const handleCreateAndAttachDocument = async () => {
    if (!itineraryId || !onCreateDocument) {
      showError('Guarda el itinerario antes de crear documentos desde la actividad');
      return;
    }

    const title = newDocumentForm.title.trim();
    const url = newDocumentForm.url.trim();

    if (!title) {
      showError('El nuevo documento necesita un título');
      return;
    }

    if (!url) {
      showError('Añade un archivo o una URL para crear el documento');
      return;
    }

    if (!isAllowedDocumentValue(url)) {
      showError('Formato no permitido. Usa PDF, JPG, PNG o WEBP');
      return;
    }

    setIsCreatingDocument(true);
    try {
      const createdDocument = await onCreateDocument({
        itineraryId,
        type: newDocumentForm.type,
        title,
        subtitle: newDocumentForm.subtitle,
        reference: newDocumentForm.reference,
        expiryDate: newDocumentForm.expiryDate,
        url,
      });

      setFormData(prev => ({
        ...prev,
        documentId: createdDocument.id,
      }));
      setNewDocumentForm(EMPTY_DOCUMENT_FORM);
      setSelectedFileName('');
      setIsQuickCreateOpen(false);
      success('Documento creado y asociado a la actividad');
    } catch (error) {
      console.error('Error creando documento desde actividad:', error);
      showError('No se pudo crear el documento');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSavingActivityMeta && !isCreatingDocument && !isEncodingFile) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gasto y documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Gasto asociado</h3>
              <p className="text-xs text-muted-foreground">
                Define coste, moneda y quién pagó para que Split siga sincronizado.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="activity-meta-cost" className="text-sm font-medium">Importe</label>
                <input
                  id="activity-meta-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData(prev => ({
                      ...prev,
                      cost: value ? parseFloat(value) : undefined,
                    }));
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Ej: 68.50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="activity-meta-currency" className="text-sm font-medium">Moneda</label>
                <select
                  id="activity-meta-currency"
                  value={formData.costCurrency ?? 'EUR'}
                  onChange={(event) => setFormData(prev => ({ ...prev, costCurrency: event.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!formData.cost}
                >
                  {POPULAR_CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="activity-meta-payer" className="text-sm font-medium">Quién pagó</label>
                <select
                  id="activity-meta-payer"
                  value={formData.costPayerId ?? ''}
                  onChange={(event) => setFormData(prev => ({
                    ...prev,
                    costPayerId: event.target.value || undefined,
                  }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!formData.cost}
                >
                  <option value="">Sin asignar</option>
                  {splitMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {splitHint && (
              <p className="text-xs text-muted-foreground">
                Reparto orientativo: {splitHint}
              </p>
            )}

            {splitMembers.length === 0 && formData.cost && (
              <p className="text-xs text-amber-700">
                Añade miembros en Split para poder asociar correctamente el gasto.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Documento relacionado</h3>
                <p className="text-xs text-muted-foreground">
                  Vincula uno existente o crea uno nuevo sin salir de esta actividad.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onCreateDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuickCreateOpen(current => !current)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isQuickCreateOpen ? 'Ocultar alta rápida' : 'Añadir documento nuevo'}
                  </Button>
                )}
                {onManageDocuments && (
                  <Button type="button" variant="outline" size="sm" onClick={onManageDocuments}>
                    Gestionar documentos
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="activity-meta-document" className="text-sm font-medium">Documento</label>
              <select
                id="activity-meta-document"
                value={formData.documentId ?? ''}
                onChange={(event) => setFormData(prev => ({
                  ...prev,
                  documentId: event.target.value || undefined,
                }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={documents.length === 0}
              >
                <option value="">Sin documento</option>
                {documents.map(document => (
                  <option key={document.id} value={document.id}>
                    {document.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                <div className="font-medium text-foreground">{selectedDocument.title}</div>
                {selectedDocument.subtitle && (
                  <div className="mt-1 text-muted-foreground">{selectedDocument.subtitle}</div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-[0.12em]">
                    {selectedDocument.type}
                  </span>
                  {selectedDocument.reference && <span>Ref. {selectedDocument.reference}</span>}
                  {selectedDocument.expiry_date && <span>Caduca {selectedDocument.expiry_date}</span>}
                </div>
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Todavía no hay documentos guardados en este itinerario.
              </p>
            ) : null}

            {isQuickCreateOpen && onCreateDocument && (
              <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white/90 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Alta rápida de documento</h4>
                  <p className="text-xs text-muted-foreground">
                    Al crearlo quedará seleccionado automáticamente en esta actividad.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="activity-new-document-type" className="text-sm font-medium">Tipo</label>
                    <select
                      id="activity-new-document-type"
                      value={newDocumentForm.type}
                      onChange={(event) => setNewDocumentForm(prev => ({
                        ...prev,
                        type: event.target.value as ItineraryDocumentType,
                      }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="passport">Pasaporte</option>
                      <option value="flight">Vuelo</option>
                      <option value="hotel">Hotel</option>
                      <option value="insurance">Seguro</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="activity-new-document-expiry" className="text-sm font-medium">Caducidad</label>
                    <input
                      id="activity-new-document-expiry"
                      type="date"
                      value={newDocumentForm.expiryDate}
                      onChange={(event) => setNewDocumentForm(prev => ({ ...prev, expiryDate: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="activity-new-document-title" className="text-sm font-medium">Título</label>
                    <input
                      id="activity-new-document-title"
                      value={newDocumentForm.title}
                      onChange={(event) => setNewDocumentForm(prev => ({ ...prev, title: event.target.value }))}
                      placeholder="Ej: Reserva hotel Tokio"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="activity-new-document-subtitle" className="text-sm font-medium">Subtítulo</label>
                    <input
                      id="activity-new-document-subtitle"
                      value={newDocumentForm.subtitle}
                      onChange={(event) => setNewDocumentForm(prev => ({ ...prev, subtitle: event.target.value }))}
                      placeholder="Opcional"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="activity-new-document-reference" className="text-sm font-medium">Referencia</label>
                    <input
                      id="activity-new-document-reference"
                      value={newDocumentForm.reference}
                      onChange={(event) => setNewDocumentForm(prev => ({ ...prev, reference: event.target.value }))}
                      placeholder="Localizador / ref"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="activity-new-document-url" className="text-sm font-medium">URL del documento</label>
                    <input
                      id="activity-new-document-url"
                      value={newDocumentForm.url}
                      onChange={(event) => setNewDocumentForm(prev => ({ ...prev, url: event.target.value }))}
                      placeholder="https://... o sube un archivo debajo"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    id="activity-new-document-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFilePicked}
                    className="sr-only"
                    disabled={isCreatingDocument || isEncodingFile}
                  />
                  <label
                    htmlFor="activity-new-document-file"
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm transition ${
                      isCreatingDocument || isEncodingFile ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    {selectedFileName || newDocumentForm.url ? 'Cambiar archivo' : 'Subir archivo'}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Formatos permitidos: PDF, JPG, PNG, WEBP. Máximo {formatBytes(MAX_FILE_SIZE_BYTES)}.
                  </p>
                  {selectedFileName && (
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Archivo seleccionado: {selectedFileName}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateAndAttachDocument}
                    disabled={isCreatingDocument || isEncodingFile || isSavingActivityMeta}
                  >
                    {isCreatingDocument ? 'Creando documento...' : 'Crear y asociar'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSavingActivityMeta || isCreatingDocument || isEncodingFile}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSavingActivityMeta || isCreatingDocument || isEncodingFile}>
            {isSavingActivityMeta ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}