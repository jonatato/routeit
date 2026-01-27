import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AnimatedCard } from '../components/AnimatedCard';
import { FormField } from '../components/FormField';
import { supabase } from '../lib/supabase';
import { createEmptyItinerary } from '../services/itinerary';
import { useToast } from '../hooks/useToast';

function PrivateHub() {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDateRange, setNewDateRange] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dateRange?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = (): boolean => {
    const newErrors: { title?: string; dateRange?: string } = {};
    
    if (!newTitle.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (newTitle.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    }
    
    if (!newDateRange.trim()) {
      newErrors.dateRange = 'El rango de fechas es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateItinerary = async () => {
    if (!validate()) {
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes estar autenticado para crear un itinerario.');
        setIsCreating(false);
        return;
      }

      const itineraryId = await createEmptyItinerary(user.id, newTitle.trim(), newDateRange.trim());
      toast.success(`Itinerario "${newTitle.trim()}" creado correctamente`);
      navigate(`/app/admin?itineraryId=${itineraryId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el itinerario. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
      setNewTitle('');
      setNewDateRange('');
      setErrors({});
    }
  };

  return (
    <div className="mx-auto flex w-full  flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Volver">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Crear Itinerario</h1>
            <p className="mt-1 text-sm text-mutedForeground">Tu espacio personal para planificar y compartir viajes.</p>
          </div>
        </div>
      </div>

      {/* Sección destacada para crear nuevo itinerario */}
      <AnimatedCard>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">Crear nuevo itinerario</CardTitle>
                <CardDescription className="text-sm">Comienza desde cero y personaliza tu viaje.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-28 items-end justify-between rounded-2xl bg-gradient-to-r from-primary/20 via-purple-100 to-primary/10 p-4">
              <div className="text-sm font-semibold text-foreground">Tu próximo viaje empieza aquí</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Título del viaje" error={errors.title} required>
                      <input
                  type="text"
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: undefined }));
                    }
                  }}
                  placeholder="Ej: Viaje a Japón 2024"
                        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                    errors.title
                      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                      : 'border-border focus:border-primary focus:ring-primary/20'
                  }`}
                  disabled={isCreating}
                />
              </FormField>
              <FormField label="Rango de fechas" error={errors.dateRange} required>
                      <input
                  type="text"
                  value={newDateRange}
                  onChange={e => {
                    setNewDateRange(e.target.value);
                    if (errors.dateRange) {
                      setErrors(prev => ({ ...prev, dateRange: undefined }));
                    }
                  }}
                  placeholder="Ej: 15-30 de marzo 2024"
                        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                    errors.dateRange
                      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                      : 'border-border focus:border-primary focus:ring-primary/20'
                  }`}
                  disabled={isCreating}
                />
              </FormField>
            </div>
            <Button
              onClick={handleCreateItinerary}
              disabled={isCreating || !newTitle.trim() || !newDateRange.trim()}
              className="w-full md:w-auto"
              size="lg"
            >
              {isCreating ? 'Creando...' : 'Crear itinerario'}
            </Button>
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Tarjetas de funciones */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnimatedCard delay={0.1}>
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <CardTitle>Mis itinerarios</CardTitle>
            <CardDescription>Gestiona y comparte tus viajes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/itineraries">
              <Button className="w-full" variant="outline">
                Abrir
              </Button>
            </Link>
          </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <CardTitle>Mi maleta</CardTitle>
            <CardDescription>Checklist privada por categorías.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/bag">
              <Button className="w-full" variant="outline">
                Abrir
              </Button>
            </Link>
          </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <CardTitle>Split</CardTitle>
            <CardDescription>Divide gastos entre participantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/split">
              <Button className="w-full" variant="outline">
                Abrir
              </Button>
            </Link>
          </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Tarjeta de perfil */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <CardTitle>Perfil y preferencias</CardTitle>
              <CardDescription>Gestiona tu cuenta y configuración</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link to="/app/profile">
            <Button className="w-full" variant="outline">
              Abrir perfil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivateHub;

