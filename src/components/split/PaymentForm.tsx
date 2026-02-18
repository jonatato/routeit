import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { SplitMember } from '../../services/split';
import { useToast } from '../../hooks/useToast';

type PaymentFormProps = {
  members: SplitMember[];
  onSave: (data: { payerId: string; payeeId: string; amount: number; note?: string }) => Promise<void>;
  onCancel?: () => void;
};

export function PaymentForm({ members, onSave, onCancel }: PaymentFormProps) {
  const [payerId, setPayerId] = useState(members[0]?.id || '');
  const [payeeId, setPayeeId] = useState(members[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!payerId || !payeeId || payerId === payeeId || !amount) return;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) return;

    try {
      setIsSaving(true);
      await onSave({
        payerId,
        payeeId,
        amount: numAmount,
        note: note.trim() || undefined,
      });
      setPayerId(members[0]?.id || '');
      setPayeeId(members[1]?.id || '');
      setAmount('');
      setNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar pago</CardTitle>
        <CardDescription>Registra un pago entre miembros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Pagador</label>
          <select
            value={payerId}
            onChange={e => setPayerId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Recibe</label>
          <select
            value={payeeId}
            onChange={e => setPayeeId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {members.filter(m => m.id !== payerId).map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cantidad</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nota (opcional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Nota sobre el pago"
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !payerId || !payeeId || payerId === payeeId} className="flex-1">
            {isSaving ? 'Guardando...' : 'Registrar pago'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

