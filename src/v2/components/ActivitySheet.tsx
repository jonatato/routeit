import type { ScheduleItem } from '../../data/itinerary';
import type { LedgerMember } from '../ledger';

type ActivitySheetProps = {
  initial: ScheduleItem | null;
  members: LedgerMember[];
  onCancel: () => void;
  onSave: (item: ScheduleItem) => void;
  onDelete?: () => void;
};

export function ActivitySheet({ initial, members, onCancel, onSave, onDelete }: ActivitySheetProps) {
  return (
    <form
      className="rounded-xl border border-border bg-card p-4"
      onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const cost = Number(data.get('cost') || 0);
        onSave({
          time: String(data.get('time') || ''),
          activity: String(data.get('activity') || '').trim(),
          mapLink: String(data.get('mapLink') || '').trim() || undefined,
          cost: cost > 0 ? cost : undefined,
          costCurrency: cost > 0 ? 'EUR' : undefined,
          costPayerId: cost > 0 ? String(data.get('payer') || members[0]?.id || '') : undefined,
          tags: initial?.tags,
          documentId: String(data.get('documentId') || '').trim() || undefined,
          lat: initial?.lat,
          lng: initial?.lng,
        });
      }}
    >
      <p className="text-sm font-semibold">{initial ? 'Editar actividad' : 'Nueva actividad'}</p>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          Hora
          <input name="time" defaultValue={initial?.time ?? ''} required className="rounded-lg border border-border bg-background px-3 py-2" placeholder="09:00" />
        </label>
        <label className="grid gap-1 text-sm">
          Qué toca
          <input name="activity" defaultValue={initial?.activity ?? ''} required className="rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Mapa
          <input name="mapLink" defaultValue={initial?.mapLink ?? ''} className="rounded-lg border border-border bg-background px-3 py-2" placeholder="https://maps.google.com/..." />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            Coste
            <input name="cost" type="number" min="0" step="0.01" defaultValue={initial?.cost ?? ''} className="rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Pagó
            <select name="payer" defaultValue={initial?.costPayerId ?? members[0]?.id} className="rounded-lg border border-border bg-background px-3 py-2">
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          Documento
          <input name="documentId" defaultValue={initial?.documentId ?? ''} className="rounded-lg border border-border bg-background px-3 py-2" placeholder="Identificador, si ya está adjunto" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primaryForeground">Guardar actividad</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm">Cancelar</button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-sm text-danger">Quitar</button>
        )}
      </div>
    </form>
  );
}
