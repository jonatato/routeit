import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { SocialVideoTag } from '../../services/socialVideos';

type VideoTagManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  tags: SocialVideoTag[];
  onCreateTag: (name: string) => Promise<SocialVideoTag>;
  onUpdateTag: (tagId: string, name: string) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
};

export function VideoTagManagerDialog({
  open,
  onClose,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: VideoTagManagerDialogProps) {
  const [newTagName, setNewTagName] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDraftNames(
      Object.fromEntries(tags.map(tag => [tag.id, tag.name])),
    );
  }, [open, tags]);

  const handleCreate = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    try {
      await onCreateTag(trimmedName);
      setNewTagName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async (tag: SocialVideoTag) => {
    const nextName = draftNames[tag.id]?.trim() ?? '';
    if (!nextName || nextName === tag.name) return;

    setBusyTagId(tag.id);
    try {
      await onUpdateTag(tag.id, nextName);
    } finally {
      setBusyTagId(null);
    }
  };

  const handleDelete = async (tag: SocialVideoTag) => {
    const confirmed = window.confirm(`Eliminar el tag "${tag.name}" tambien lo quitara de los videos que lo usen. ¿Continuar?`);
    if (!confirmed) return;

    setBusyTagId(tag.id);
    try {
      await onDeleteTag(tag.id);
    } finally {
      setBusyTagId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Gestionar Tags de Video
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar gestor de tags">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={event => setNewTagName(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleCreate();
                }
              }}
              placeholder="Crear nuevo tag para este viaje"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              disabled={isCreating}
            />
            <Button onClick={() => void handleCreate()} disabled={isCreating || !newTagName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </div>

          <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-xl border border-border p-3">
            {tags.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                Todavia no hay tags de video para este itinerario.
              </div>
            ) : (
              tags.map(tag => {
                const isBusy = busyTagId === tag.id;
                const nextName = draftNames[tag.id] ?? tag.name;
                const hasChanges = nextName.trim() !== '' && nextName.trim() !== tag.name;

                return (
                  <div key={tag.id} className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                        Tag
                      </div>
                      <input
                        type="text"
                        value={nextName}
                        onChange={event => setDraftNames(prev => ({ ...prev, [tag.id]: event.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        disabled={isBusy}
                      />
                      <p className="text-xs text-muted-foreground">Slug actual: {tag.slug}</p>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDraftNames(prev => ({ ...prev, [tag.id]: tag.name }))}
                        disabled={isBusy || !hasChanges}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Descartar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleSave(tag)}
                        disabled={isBusy || !hasChanges}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(tag)}
                        disabled={isBusy}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}