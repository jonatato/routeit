import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import DocumentDetailFields from './DocumentDetailFields';
import { useToast } from '../hooks/useToast';
import {
  approveItineraryDocumentSubmission,
  cancelItineraryDocumentSubmission,
  cloneDocumentDetailsForType,
  createItineraryDocument,
  createEmptyDocumentDetailsByType,
  deleteItineraryDocument,
  DOCUMENT_TYPE_OPTIONS,
  getDocumentDetailSummary,
  getDocumentTypeLabel,
  listItineraryDocumentsByVisibility,
  listItineraryDocumentSubmissions,
  rejectItineraryDocumentSubmission,
  submitItineraryDocumentForReview,
  updateItineraryDocument,
  type ItineraryDocument,
  type ItineraryDocumentDetailsByType,
  type ItineraryDocumentSubmission,
  type ItineraryDocumentType,
  type ItineraryDocumentVisibility,
} from '../services/documents';
import { type CollaboratorRole } from '../services/sharing';
import {
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_DOCUMENT_MIME_TYPES,
  isAllowedDocumentValue,
  isBase64Document,
} from '../utils/documentPreview';
import { subscribeToDocumentSubmissionChanges, unsubscribe } from '../services/realtime';

type ItineraryDocumentsSectionProps = {
  itineraryId?: string;
  role: CollaboratorRole | null;
  currentUserId?: string | null;
};

type DocumentTabKey = 'public' | 'private' | 'pending' | 'my-submissions';

type DocumentFormState = {
  type: ItineraryDocumentType;
  visibility: ItineraryDocumentVisibility;
  title: string;
  subtitle: string;
  reference: string;
  expiryDate: string;
  url: string;
  detailsByType: ItineraryDocumentDetailsByType;
};

const createEmptyForm = (visibility: ItineraryDocumentVisibility = 'public'): DocumentFormState => ({
  type: 'other',
  visibility,
  title: '',
  subtitle: '',
  reference: '',
  expiryDate: '',
  url: '',
  detailsByType: createEmptyDocumentDetailsByType(),
});

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const VISIBILITY_OPTIONS: Array<{ value: ItineraryDocumentVisibility; label: string }> = [
  { value: 'public', label: 'Publico del viaje' },
  { value: 'private', label: 'Privado / personal' },
];

const SEGMENT_TRIGGER_CLASS_NAME =
  'group flex-1 min-w-0 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-mutedForeground data-[state=active]:bg-primary data-[state=active]:text-primaryForeground data-[state=active]:shadow-[0_8px_18px_rgba(124,58,237,0.18)]';

const SEGMENT_BADGE_CLASS_NAME =
  'ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full border-0 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary group-data-[state=active]:bg-white/20 group-data-[state=active]:text-primaryForeground';

const getDocumentIcon = (type: ItineraryDocumentType) => {
  switch (type) {
    case 'passport':
      return 'DOC';
    case 'flight':
      return 'FLY';
    case 'hotel':
      return 'HTL';
    case 'insurance':
      return 'INS';
    case 'ground_transport':
      return 'TRN';
    case 'car_rental':
      return 'CAR';
    default:
      return 'FILE';
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
    return { text: `Expira en ${daysUntilExpiry} dias`, color: 'text-orange-600 dark:text-orange-400' };
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

const getSubmissionStatusLabel = (submission: ItineraryDocumentSubmission) => {
  switch (submission.status) {
    case 'approved':
      return { label: 'Aprobado', color: 'text-emerald-700 dark:text-emerald-300' };
    case 'rejected':
      return { label: 'Rechazado', color: 'text-red-700 dark:text-red-300' };
    case 'cancelled':
      return { label: 'Cancelado', color: 'text-mutedForeground' };
    default:
      return { label: 'Pendiente', color: 'text-amber-700 dark:text-amber-300' };
  }
};

const getAvailableTabs = (role: CollaboratorRole | null): DocumentTabKey[] => {
  const base: DocumentTabKey[] = ['public', 'private'];

  if (role === 'owner' || role === 'editor') {
    return [...base, 'pending'];
  }

  if (role === 'viewer') {
    return [...base, 'my-submissions'];
  }

  return base;
};

function ItineraryDocumentsSection({ itineraryId, role, currentUserId }: ItineraryDocumentsSectionProps) {
  const [publicDocuments, setPublicDocuments] = useState<ItineraryDocument[]>([]);
  const [privateDocuments, setPrivateDocuments] = useState<ItineraryDocument[]>([]);
  const [submissions, setSubmissions] = useState<ItineraryDocumentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEncodingFile, setIsEncodingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentFormState>(() => createEmptyForm());
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string } | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentTabKey>('public');
  const { success, error: showError } = useToast();

  const availableTabs = useMemo(() => getAvailableTabs(role), [role]);
  const isEditorRole = role === 'owner' || role === 'editor';
  const isViewerRole = role === 'viewer';
  const tabStorageKey = itineraryId ? `routeit-documents-tab-${itineraryId}-${role ?? 'guest'}` : null;

  const allDocuments = useMemo(() => [...publicDocuments, ...privateDocuments], [privateDocuments, publicDocuments]);
  const editingDocument = useMemo(
    () => allDocuments.find(doc => doc.id === editingDocumentId) ?? null,
    [allDocuments, editingDocumentId],
  );
  const pendingSubmissions = useMemo(
    () => submissions.filter(submission => submission.status === 'pending'),
    [submissions],
  );
  const mySubmissions = useMemo(
    () => submissions.filter(submission => submission.submitted_by === currentUserId),
    [currentUserId, submissions],
  );

  const loadData = useCallback(async () => {
    if (!itineraryId) {
      setPublicDocuments([]);
      setPrivateDocuments([]);
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    try {
      const [publicData, privateData, submissionData] = await Promise.all([
        listItineraryDocumentsByVisibility(itineraryId, 'public'),
        listItineraryDocumentsByVisibility(itineraryId, 'private'),
        role ? listItineraryDocumentSubmissions(itineraryId) : Promise.resolve([]),
      ]);

      setPublicDocuments(publicData);
      setPrivateDocuments(privateData);
      setSubmissions(submissionData);
    } catch (error) {
      console.error('Error loading itinerary documents:', error);
      showError('No se pudieron cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  }, [itineraryId, role, showError]);

  useEffect(() => {
    const stored = tabStorageKey ? window.localStorage.getItem(tabStorageKey) : null;
    if (stored && availableTabs.includes(stored as DocumentTabKey)) {
      setActiveTab(stored as DocumentTabKey);
      return;
    }
    setActiveTab(availableTabs[0] ?? 'public');
  }, [availableTabs, tabStorageKey]);

  useEffect(() => {
    if (tabStorageKey) {
      window.localStorage.setItem(tabStorageKey, activeTab);
    }
  }, [activeTab, tabStorageKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!itineraryId || !role) return;

    const channel = subscribeToDocumentSubmissionChanges(itineraryId, () => {
      void loadData();
    });

    return () => {
      unsubscribe(channel);
    };
  }, [itineraryId, loadData, role]);

  const openCreateDialog = (visibility: ItineraryDocumentVisibility) => {
    setEditingDocumentId(null);
    setForm(createEmptyForm(visibility));
    setSelectedFileName('');
    setIsDialogOpen(true);
  };

  const resetDialogState = () => {
    setIsDialogOpen(false);
    setEditingDocumentId(null);
    setForm(createEmptyForm());
    setSelectedFileName('');
  };

  const openEditDialog = (document: ItineraryDocument) => {
    const detailsByType = {
      ...createEmptyDocumentDetailsByType(),
      [document.type]: cloneDocumentDetailsForType(document.type, document.details),
    } as ItineraryDocumentDetailsByType;

    setEditingDocumentId(document.id);
    setForm({
      type: document.type,
      visibility: document.visibility,
      title: document.title,
      subtitle: document.subtitle ?? '',
      reference: document.reference ?? '',
      expiryDate: document.expiry_date ?? '',
      url: document.url,
      detailsByType,
    });
    setSelectedFileName(getFileLabel(document.url));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving || isEncodingFile) return;
    resetDialogState();
  };

  const handleOpenDocument = (document: Pick<ItineraryDocument, 'title' | 'url'>) => {
    const trimmedUrl = document.url.trim();
    if (!trimmedUrl) {
      showError('El documento no tiene un archivo o enlace valido');
      return;
    }

    setPreviewDocument({ title: document.title, url: trimmedUrl });
  };

  const handleFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showError(`Archivo demasiado grande. Maximo ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
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
      console.error('Error encoding document as base64:', error);
      showError('No se pudo procesar el archivo');
    } finally {
      setIsEncodingFile(false);
    }
  };

  const canEditDocument = (document: ItineraryDocument) => {
    if (document.visibility === 'private') {
      return document.user_id === currentUserId;
    }
    return isEditorRole;
  };

  const canDeleteDocument = canEditDocument;

  const updateDetailValues = (type: ItineraryDocumentType, patch: Record<string, string>) => {
    setForm(prev => ({
      ...prev,
      detailsByType: {
        ...prev.detailsByType,
        [type]: {
          ...prev.detailsByType[type],
          ...patch,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    if (!itineraryId) {
      showError('Guarda primero tu itinerario para gestionar documentos');
      return;
    }

    const title = form.title.trim();
    const url = form.url.trim();

    if (!title) {
      showError('El titulo es obligatorio');
      return;
    }

    if (!url) {
      showError('Anade un archivo o una URL antes de guardar');
      return;
    }

    if (!isAllowedDocumentValue(url)) {
      showError('Formato no permitido. Usa PDF, JPG, PNG o WEBP');
      return;
    }

    setIsSaving(true);
    try {
      const selectedDetails = form.detailsByType[form.type];

      if (editingDocument) {
        await updateItineraryDocument(editingDocument.id, {
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          expiryDate: form.expiryDate,
          url,
          visibility: form.visibility,
          details: selectedDetails,
        });

        success('Documento actualizado');
      } else if (form.visibility === 'public' && isViewerRole) {
        await submitItineraryDocumentForReview({
          itineraryId,
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          expiryDate: form.expiryDate,
          url,
          details: selectedDetails,
        });

        success('Documento publico enviado para revision');
      } else {
        await createItineraryDocument({
          itineraryId,
          type: form.type,
          title,
          subtitle: form.subtitle,
          reference: form.reference,
          expiryDate: form.expiryDate,
          url,
          visibility: form.visibility,
          details: selectedDetails,
        });

        success(form.visibility === 'private' ? 'Documento personal anadido' : 'Documento anadido');
      }

      resetDialogState();
      await loadData();
    } catch (error) {
      console.error('Error saving document:', error);
      showError('No se pudo guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (document: ItineraryDocument) => {
    if (!canDeleteDocument(document)) return;

    const confirmed = window.confirm(`Eliminar "${document.title}"?`);
    if (!confirmed) return;

    try {
      await deleteItineraryDocument(document.id);
      success('Documento eliminado');
      await loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('No se pudo eliminar el documento');
    }
  };

  const handleApproveSubmission = async (submission: ItineraryDocumentSubmission) => {
    const note = window.prompt('Nota de aprobacion opcional:', '') ?? undefined;

    try {
      await approveItineraryDocumentSubmission(submission.id, note);
      success('Documento aprobado y publicado');
      await loadData();
    } catch (error) {
      console.error('Error approving submission:', error);
      showError('No se pudo aprobar el documento');
    }
  };

  const handleRejectSubmission = async (submission: ItineraryDocumentSubmission) => {
    const note = window.prompt('Motivo del rechazo:', '') ?? undefined;
    if (note === undefined) return;

    try {
      await rejectItineraryDocumentSubmission(submission.id, note);
      success('Documento rechazado');
      await loadData();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      showError('No se pudo rechazar el documento');
    }
  };

  const handleCancelSubmission = async (submission: ItineraryDocumentSubmission) => {
    const confirmed = window.confirm(`Cancelar el envio de "${submission.title}"?`);
    if (!confirmed) return;

    try {
      await cancelItineraryDocumentSubmission(submission.id);
      success('Envio cancelado');
      await loadData();
    } catch (error) {
      console.error('Error cancelling submission:', error);
      showError('No se pudo cancelar el envio');
    }
  };

  const activeCreateVisibility =
    activeTab === 'private' ? 'private' : activeTab === 'public' || activeTab === 'my-submissions' ? 'public' : null;

  const addButtonLabel = useMemo(() => {
    if (activeTab === 'private') return 'Anadir documento personal';
    if (activeTab === 'public' || activeTab === 'my-submissions') {
      return isViewerRole ? 'Proponer documento publico' : 'Anadir documento publico';
    }
    return null;
  }, [activeTab, isViewerRole]);

  const renderDocumentsTable = (
    documents: ItineraryDocument[],
    emptyTitle: string,
    emptyDescription: string,
  ) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="pt-6 text-sm text-mutedForeground">Cargando documentos...</CardContent>
        </Card>
      );
    }

    if (documents.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{emptyTitle}</CardTitle>
            <CardDescription>{emptyDescription}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden border-border/70">
        <div className="divide-y divide-border/70 md:hidden">
          {documents.map(document => {
            const expiryInfo = getExpiryWarning(document.expiry_date);
            const typeLabel = getDocumentTypeLabel(document.type);
            const detailSummary = getDocumentDetailSummary(document.type, document.details);

            return (
              <div key={document.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-start gap-3">
                    <span className="mt-0.5 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
                      {getDocumentIcon(document.type)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
                      {document.subtitle && (
                        <p className="mt-1 truncate text-xs text-mutedForeground">{document.subtitle}</p>
                      )}
                      {detailSummary.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {detailSummary.slice(0, 3).map(item => (
                            <span
                              key={`${document.id}-${item}`}
                              className="rounded-full bg-muted px-2 py-1 text-[11px] text-mutedForeground"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
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
                    {canEditDocument(document) && (
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
                    )}
                    {canDeleteDocument(document) && (
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

        <div className="hidden overflow-x-auto md:block">
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
                const typeLabel = getDocumentTypeLabel(document.type);
                const detailSummary = getDocumentDetailSummary(document.type, document.details);

                return (
                  <tr key={document.id} className="border-b border-border/70 last:border-b-0 align-middle">
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
                          {getDocumentIcon(document.type)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
                          {document.subtitle && (
                            <p className="mt-1 truncate text-xs text-mutedForeground">{document.subtitle}</p>
                          )}
                          {detailSummary.length > 0 && (
                            <p className="mt-1 truncate text-xs text-mutedForeground">
                              {detailSummary.slice(0, 3).join(' · ')}
                            </p>
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
                        {canEditDocument(document) && (
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
                        )}
                        {canDeleteDocument(document) && (
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
    );
  };

  const renderSubmissionList = (
    items: ItineraryDocumentSubmission[],
    emptyTitle: string,
    emptyDescription: string,
    mode: 'pending' | 'mine',
  ) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="pt-6 text-sm text-mutedForeground">Cargando envios...</CardContent>
        </Card>
      );
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{emptyTitle}</CardTitle>
            <CardDescription>{emptyDescription}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {items.map(submission => {
          const statusInfo = getSubmissionStatusLabel(submission);
          const typeLabel = getDocumentTypeLabel(submission.type);
          const detailSummary = getDocumentDetailSummary(submission.type, submission.details);

          return (
            <Card key={submission.id} className="border-border/70">
              <CardHeader className="gap-3 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{submission.title}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span>{typeLabel}</span>
                      <span>•</span>
                      <span className={statusInfo.color}>{statusInfo.label}</span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {submission.subtitle && <p className="text-mutedForeground">{submission.subtitle}</p>}

                {detailSummary.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detailSummary.slice(0, 4).map(item => (
                      <span
                        key={`${submission.id}-${item}`}
                        className="rounded-full bg-muted px-2 py-1 text-xs text-mutedForeground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mutedForeground">Referencia</p>
                    <p className="mt-1 text-foreground">{submission.reference || 'Sin ref.'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mutedForeground">Creado</p>
                    <p className="mt-1 text-foreground">{new Date(submission.created_at).toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mutedForeground">Visibilidad</p>
                    <p className="mt-1 text-foreground">Publico del viaje</p>
                  </div>
                </div>

                {submission.review_note && (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-mutedForeground">
                    {submission.review_note}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {mode === 'pending' && submission.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApproveSubmission(submission)}>
                        <Check className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectSubmission(submission)}>
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {mode === 'mine' && submission.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => handleCancelSubmission(submission)}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar envio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-mutedForeground">
            Guarda billetes, reservas y polizas con sus datos utiles para tenerlos a mano durante el viaje.
          </p>
          {isViewerRole ? (
            <p className="text-xs text-mutedForeground">
              Tus documentos privados son personales. Los documentos publicos que propongas quedaran pendientes de revision.
            </p>
          ) : (
            <p className="text-xs text-mutedForeground">
              Los documentos publicos son visibles para el viaje. Los privados solo los ve su autor.
            </p>
          )}
        </div>

        {itineraryId && activeCreateVisibility && addButtonLabel && (
          <Button size="sm" onClick={() => openCreateDialog(activeCreateVisibility)}>
            {activeCreateVisibility === 'public' && isViewerRole ? (
              <Send className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {addButtonLabel}
          </Button>
        )}
      </div>

      {!itineraryId && (
        <Card>
          <CardContent className="pt-6 text-sm text-mutedForeground">
            Guarda el itinerario para habilitar la gestion de documentos.
          </CardContent>
        </Card>
      )}

      {itineraryId && (
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as DocumentTabKey)}>
          <div className="w-full pb-1">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-full border border-primary/10 bg-primary/10 p-1 shadow-none dark:border-primary/20 dark:bg-primary/10">
              <TabsTrigger value="public" className={SEGMENT_TRIGGER_CLASS_NAME}>
                <span className="truncate">Publicos</span>
                <Badge className={SEGMENT_BADGE_CLASS_NAME}>{publicDocuments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="private" className={SEGMENT_TRIGGER_CLASS_NAME}>
                <span className="truncate">Privados</span>
                <Badge className={SEGMENT_BADGE_CLASS_NAME}>{privateDocuments.length}</Badge>
              </TabsTrigger>
              {isEditorRole && (
                <TabsTrigger value="pending" className={SEGMENT_TRIGGER_CLASS_NAME}>
                  <span className="truncate">Pendientes</span>
                  <Badge className={SEGMENT_BADGE_CLASS_NAME}>{pendingSubmissions.length}</Badge>
                </TabsTrigger>
              )}
              {isViewerRole && (
                <TabsTrigger value="my-submissions" className={SEGMENT_TRIGGER_CLASS_NAME}>
                  <span className="truncate">Mis envios</span>
                  <Badge className={SEGMENT_BADGE_CLASS_NAME}>{mySubmissions.length}</Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="public">
            {renderDocumentsTable(
              publicDocuments,
              'Sin documentos publicos',
              isViewerRole
                ? 'Aun no hay documentos publicos para este itinerario. Puedes proponer uno para revision.'
                : 'Aun no hay documentos publicos para este itinerario.',
            )}
          </TabsContent>

          <TabsContent value="private">
            {renderDocumentsTable(
              privateDocuments,
              'Sin documentos privados',
              'Aqui veras solo los documentos personales creados por ti.',
            )}
          </TabsContent>

          {isEditorRole && (
            <TabsContent value="pending">
              {renderSubmissionList(
                pendingSubmissions,
                'Sin documentos pendientes',
                'Las propuestas publicas enviadas por viewers apareceran aqui para aprobarlas o rechazarlas.',
                'pending',
              )}
            </TabsContent>
          )}

          {isViewerRole && (
            <TabsContent value="my-submissions">
              {renderSubmissionList(
                mySubmissions,
                'Sin envios publicos',
                'Aqui veras el estado de tus propuestas de documentos publicos.',
                'mine',
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      <Dialog open={isDialogOpen} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Editar documento' : 'Anadir documento'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="doc-visibility" className="text-sm font-medium">
                Visibilidad
              </label>
              <select
                id="doc-visibility"
                value={form.visibility}
                onChange={event =>
                  setForm(prev => ({ ...prev, visibility: event.target.value as ItineraryDocumentVisibility }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={Boolean(editingDocument) || isSaving}
              >
                {VISIBILITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.visibility === 'public' && isViewerRole && !editingDocument && (
                <p className="text-xs text-mutedForeground">
                  Este documento se enviara a revision antes de publicarse en el viaje.
                </p>
              )}
            </div>

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
                {DOCUMENT_TYPE_OPTIONS.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="doc-expiry" className="text-sm font-medium">
                Fecha de expiracion
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
                Titulo
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
                Subtitulo
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

            <div className="space-y-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium">Datos del documento</p>
                <p className="text-xs text-mutedForeground">
                  Campos especificos para {getDocumentTypeLabel(form.type).toLowerCase()}.
                </p>
              </div>
              <DocumentDetailFields
                type={form.type}
                detailsByType={form.detailsByType}
                onChange={updateDetailValues}
                idPrefix="doc-details"
                disabled={isSaving || isEncodingFile}
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
                  Formatos permitidos: PDF, JPG, PNG, WEBP. Maximo {formatBytes(MAX_FILE_SIZE_BYTES)}.
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
              {isSaving
                ? 'Guardando...'
                : editingDocument
                  ? 'Guardar cambios'
                  : form.visibility === 'public' && isViewerRole
                    ? 'Enviar para aprobacion'
                    : 'Guardar documento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentPreviewModal
        open={Boolean(previewDocument)}
        onOpenChange={open => {
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
