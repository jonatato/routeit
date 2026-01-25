import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { acceptShareLink, createShareLink, listCollaborators, listUserItineraries, removeCollaborator } from '../services/sharing';

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
  const [collaborators, setCollaborators] = useState<Array<{ id: string; user_id: string; role: string }>>([]);
  const [acceptToken, setAcceptToken] = useState('');
  const navigate = useNavigate();

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
    if (!raw) return;
    let token = raw;
    if (raw.includes('token=')) {
      try {
        token = new URL(raw).searchParams.get('token') ?? raw;
      } catch {
        token = raw.split('token=')[1] ?? raw;
      }
    }
    await acceptShareLink(token);
    setAcceptToken('');
    await load();
    navigate('/app/itineraries', { replace: true });
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Mis itinerarios</h1>
          <p className="text-sm text-mutedForeground">Crea, comparte y gestiona.</p>
        </div>
        <Link to="/app/private">
          <Button variant="outline">Volver</Button>
        </Link>
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
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
            <CardContent className="flex flex-wrap gap-2">
              <Link to={`/app?itineraryId=${itinerary.id}`}>
                <Button variant="outline">Abrir</Button>
              </Link>
              {itinerary.role !== 'viewer' && (
                <Link to={`/app/admin?itineraryId=${itinerary.id}`}>
                  <Button variant="outline">Editar</Button>
                </Link>
              )}
              {itinerary.role === 'owner' && (
                <Button onClick={() => openShare(itinerary.id)}>Compartir</Button>
              )}
              <span className="ml-auto rounded-full border border-border px-3 py-1 text-xs text-mutedForeground">
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
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span>{item.user_id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-mutedForeground">{item.role}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!shareTarget) return;
                          void removeCollaborator(item.id).then(() => openShare(shareTarget));
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
    </div>
  );
}

export default MyItineraries;
