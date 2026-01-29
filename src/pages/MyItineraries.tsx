import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { supabase } from '../lib/supabase';
import { acceptShareLink, createShareLink, deleteItinerary, listCollaborators, listUserItineraries, removeCollaborator } from '../services/sharing';
import { createEmptyItinerary } from '../services/itinerary';
import { useToast } from '../hooks/useToast';

type ShareRole = 'editor' | 'viewer';

function MyItineraries() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<Array<{
    id: string;
    title: string;
    dateRange: string;
    ownerId: string;
    role: string;
  }>>([]);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [shareRole, setShareRole] = useState<ShareRole>('viewer');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Array<{ 
    id: string; 
    user_id: string; 
    role: string;
    identifier: string;
    email: string;
    has_accepted: boolean;
    is_pending: boolean;
    token?: string;
  }>>([]);
  const [acceptToken, setAcceptToken] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDateRange, setNewDateRange] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setError('No hay sesión activa.');
      setIsLoading(false);
      return;
    }
    try {
      const dataItineraries = await listUserItineraries(user.id);
      setItineraries(dataItineraries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los itinerarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const ownedItineraries = useMemo(() => itineraries.filter(item => item.role === 'owner'), [itineraries]);

  const openShare = async (itineraryId: string) => {
    setShareTarget(itineraryId);
    setShareLink(null);
    const data = await listCollaborators(itineraryId);
    setCollaborators(data);
  };

  const handleGenerateShare = async () => {
    if (!shareTarget) return;
    const link = await createShareLink(shareTarget, shareRole);
    const full = `${window.location.origin}/app/share?token=${link.token}`;
    setShareLink(full);
  };

  const handleAcceptShare = async () => {
    const raw = acceptToken.trim();
    if (!raw) {
      toast.error('Por favor, introduce un token de invitación');
      return;
    }
    let token = raw;
    if (raw.includes('token=')) {
      try {
        token = new URL(raw).searchParams.get('token') ?? raw;
      } catch {
        token = raw.split('token=')[1] ?? raw;
      }
    }
    try {
      await acceptShareLink(token);
      setAcceptToken('');
      await load();
      toast.success('Invitación aceptada correctamente');
      navigate('/app/itineraries', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la invitación');
    }
  };

  const handleDeleteItinerary = (itineraryId: string, title: string) => {
    setConfirmDelete({ id: itineraryId, title });
  };

  const confirmDeleteItinerary = async () => {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes estar autenticado para eliminar un itinerario.');
        setConfirmDelete(null);
        setDeletingId(null);
        return;
      }
      await deleteItinerary(confirmDelete.id, user.id);
      await load();
      toast.success(`Itinerario "${confirmDelete.title}" eliminado correctamente`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el itinerario.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleCreateItinerary = async () => {
    if (!newTitle.trim() || !newDateRange.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes estar autenticado para crear un itinerario.');
        return;
      }

      const newItineraryId = await createEmptyItinerary(user.id, newTitle, newDateRange);
      toast.success(`Itinerario "${newTitle}" creado correctamente`);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDateRange('');
      await load();
      navigate(`/app/admin?itineraryId=${newItineraryId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el itinerario.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">Cargando itinerarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 pb-24 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Volver">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Mis itinerarios</h1>
            <p className="text-sm text-mutedForeground">Crea, comparte y gestiona.</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Crear Nuevo Itinerario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aceptar invitación</CardTitle>
          <CardDescription>Pega un token o enlace de invitación.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <input
            value={acceptToken}
            onChange={event => setAcceptToken(event.target.value)}
            placeholder="Token de invitación"
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm"
          />
          <Button onClick={handleAcceptShare}>Aceptar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {itineraries.map(itinerary => (
          <Card key={itinerary.id}>
            <CardHeader>
              <CardTitle>{itinerary.title}</CardTitle>
              <CardDescription>{itinerary.dateRange}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Link to={`/app?itineraryId=${itinerary.id}`}>
                <Button variant="outline">Abrir</Button>
              </Link>
              {itinerary.role !== 'viewer' && (
                <Link to={`/app/admin?itineraryId=${itinerary.id}`}>
                  <Button variant="outline">Editar</Button>
                </Link>
              )}
              {itinerary.role === 'owner' && (
                <>
                  <Button onClick={() => openShare(itinerary.id)}>Compartir</Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteItinerary(itinerary.id, itinerary.title)}
                    disabled={deletingId === itinerary.id}
                  >
                    {deletingId === itinerary.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </>
              )}
              <span className="ml-auto rounded-full border border-border px-3 py-1 text-xs text-mutedForeground capitalize flex items-center">
                {itinerary.role}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {shareTarget && (
        <Card>
          <CardHeader>
            <CardTitle>Compartir itinerario</CardTitle>
            <CardDescription>Genera un enlace con rol.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={shareRole}
                onChange={event => setShareRole(event.target.value as ShareRole)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button onClick={handleGenerateShare}>Generar enlace</Button>
              <Button variant="ghost" onClick={() => setShareTarget(null)}>
                Cerrar
              </Button>
            </div>
            {shareLink && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={shareLink}
                  readOnly
                  className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                >
                  Copiar
                </Button>
              </div>
            )}
            {collaborators.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                  Colaboradores
                </p>
                {collaborators.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-white/80 px-3 py-2 text-sm shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`truncate ${item.is_pending ? 'text-mutedForeground italic' : ''}`}>
                          {item.is_pending ? item.identifier : item.email}
                        </span>
                        {item.is_pending && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 whitespace-nowrap">
                            Pendiente
                          </span>
                        )}
                        {!item.is_pending && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 whitespace-nowrap">
                            Aceptado
                          </span>
                        )}
                      </div>
                      {item.is_pending && item.token && (
                        <p className="text-xs text-mutedForeground mt-1">
                          Token: {item.token.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize whitespace-nowrap">{item.role}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!shareTarget) return;
                          if (item.is_pending) {
                            // Eliminar el link de invitación
                            void supabase
                              .from('itinerary_share_links')
                              .delete()
                              .eq('id', item.id)
                              .then(() => openShare(shareTarget));
                          } else {
                            // Eliminar colaborador
                            void removeCollaborator(item.id).then(() => openShare(shareTarget));
                          }
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {collaborators.length === 0 && (
              <p className="text-sm text-mutedForeground">Sin colaboradores todavía.</p>
            )}
          </CardContent>
        </Card>
      )}

      {ownedItineraries.length === 0 && (
        <p className="text-sm text-mutedForeground">Aún no tienes itinerarios.</p>
      )}

      {/* Modal de creación */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateModal(false)} />
          <Card className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 shadow-2xl">
            <CardHeader>
              <CardTitle>Crear Nuevo Itinerario</CardTitle>
              <CardDescription>Ingresa los detalles básicos para comenzar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título del viaje</label>
                <input
                  type="text"
                  placeholder="Ej: Viaje a Japón 2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fechas del viaje</label>
                <input
                  type="text"
                  placeholder="Ej: 15-30 Marzo 2026"
                  value={newDateRange}
                  onChange={e => setNewDateRange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleCreateItinerary} 
                  disabled={isCreating || !newTitle.trim() || !newDateRange.trim()}
                  className="flex-1"
                >
                  {isCreating ? 'Creando...' : 'Crear Itinerario'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTitle('');
                    setNewDateRange('');
                  }}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar itinerario"
        message={`¿Estás seguro de que quieres eliminar "${confirmDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteItinerary}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default MyItineraries;
