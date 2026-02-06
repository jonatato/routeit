import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { fetchSectionPreferences, updateSectionPreferences, toggleSectionVisibility, type SectionPreference } from '../services/sections';

function SortableSectionItem({ preference, onToggle }: { preference: SectionPreference; onToggle: (id: string, visible: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: preference.id,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-4 ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-mutedForeground hover:text-foreground touch-none select-none flex-shrink-0 p-1 -ml-1"
        aria-label="Arrastrar para reordenar"
        role="button"
        tabIndex={0}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <span className="flex-1 font-medium">{preference.section_label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle(preference.id, !preference.is_visible);
        }}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted flex-shrink-0"
        aria-label={preference.is_visible ? 'Ocultar sección' : 'Mostrar sección'}
      >
        {preference.is_visible ? (
          <>
            <Eye className="h-4 w-4" />
            <span>Visible</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4" />
            <span>Oculta</span>
          </>
        )}
      </button>
    </div>
  );
}

function AdminSections() {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<SectionPreference[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSectionPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = preferences.findIndex(p => p.id === active.id);
    const newIndex = preferences.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newPreferences = arrayMove(preferences, oldIndex, newIndex).map((pref, index) => ({
      ...pref,
      order_index: index,
    }));

    setPreferences(newPreferences);

    // Guardar cambios
    setIsSaving(true);
    try {
      await updateSectionPreferences(newPreferences.map(p => ({ id: p.id, order_index: p.order_index, is_visible: p.is_visible })));
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Revertir cambios en caso de error
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    const newPreferences = preferences.map(p => (p.id === id ? { ...p, is_visible: visible } : p));
    setPreferences(newPreferences);

    try {
      await toggleSectionVisibility(id, visible);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      // Revertir cambios en caso de error
      await load();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="text-6xl">⚙️</div>
          <p className="text-sm text-mutedForeground">Cargando secciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 pb-24 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            Administrar secciones
          </h1>
          <p className="text-sm text-mutedForeground">Reordena y oculta secciones del itinerario.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/admin">
            <Button variant="outline">Volver</Button>
          </Link>
          <Link to="/app/itinerary">
            <Button>Ver itinerario</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secciones del itinerario</CardTitle>
          <CardDescription>
            Arrastra para reordenar. Usa el botón de visibilidad para ocultar o mostrar secciones.
            {isSaving && <span className="ml-2 text-primary">Guardando...</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={preferences.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {preferences.map(preference => (
                  <SortableSectionItem
                    key={preference.id}
                    preference={preference}
                    onToggle={handleToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSections;
