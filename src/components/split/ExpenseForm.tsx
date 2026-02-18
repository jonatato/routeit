import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FormField } from '../FormField';
import type { SplitMember, SplitCategory, SplitTag } from '../../services/split';

type DivisionType = 'equal' | 'percentage' | 'exact' | 'shares';

type ExpenseFormProps = {
  members: SplitMember[];
  categories: SplitCategory[];
  tags: SplitTag[];
  onSave: (data: {
    title: string;
    amount: number;
    payerId: string;
    divisionType: DivisionType;
    shares: Array<{ member_id: string; amount: number }>;
    expenseDate?: string;
    categoryId?: string;
    tagIds: string[];
  }) => Promise<void>;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    amount?: number;
    payerId?: string;
    divisionType?: DivisionType;
    expenseDate?: string;
    categoryId?: string;
    tagIds?: string[];
    participantIds?: string[];
    customShares?: Record<string, string>;
  };
};

export function ExpenseForm({ members, categories, tags, onSave, onCancel, initialData }: ExpenseFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [payerId, setPayerId] = useState(initialData?.payerId || members[0]?.id || '');
  const [divisionType, setDivisionType] = useState<DivisionType>(initialData?.divisionType || 'equal');
  const [expenseDate, setExpenseDate] = useState(initialData?.expenseDate || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [customShares, setCustomShares] = useState<Record<string, string>>(initialData?.customShares || {});
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialData?.participantIds && initialData.participantIds.length > 0
      ? initialData.participantIds
      : members.map(member => member.id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string; shares?: string }>({});

  const calculateShares = (): Array<{ member_id: string; amount: number }> => {
    const totalAmount = Number(amount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return [];

    const activeMembers = members.filter(member => selectedMemberIds.includes(member.id));
    if (activeMembers.length === 0) return [];

    if (divisionType === 'equal') {
      return activeMembers.map(member => ({ member_id: member.id, amount: totalAmount / activeMembers.length }));
    }

    if (divisionType === 'percentage') {
      const totalPercentage = activeMembers.reduce((sum, member) => {
        const pct = Number(customShares[member.id] || 0);
        return sum + pct;
      }, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Los porcentajes deben sumar 100%');
      }
      return activeMembers.map(member => ({
        member_id: member.id,
        amount: (totalAmount * Number(customShares[member.id] || 0)) / 100,
      }));
    }

    if (divisionType === 'exact') {
      const totalExact = activeMembers.reduce((sum, member) => {
        const exact = Number(customShares[member.id] || 0);
        return sum + exact;
      }, 0);
      if (Math.abs(totalExact - totalAmount) > 0.01) {
        throw new Error(`Las cantidades deben sumar ${totalAmount.toFixed(2)}`);
      }
      return activeMembers.map(member => ({
        member_id: member.id,
        amount: Number(customShares[member.id] || 0),
      }));
    }

    if (divisionType === 'shares') {
      const totalShares = activeMembers.reduce((sum, member) => {
        const shares = Number(customShares[member.id] || 1);
        return sum + shares;
      }, 0);
      return activeMembers.map(member => {
        const shares = Number(customShares[member.id] || 1);
        return { member_id: member.id, amount: (totalAmount * shares) / totalShares };
      });
    }

    return [];
  };

  const validate = (): boolean => {
    const newErrors: { title?: string; amount?: string; shares?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    const numAmount = Number(amount);
    if (!amount || !Number.isFinite(numAmount) || numAmount <= 0) {
      newErrors.amount = 'La cantidad debe ser mayor a 0';
    }

    try {
      const shares = calculateShares();
      if (shares.length === 0) {
        newErrors.shares = 'Selecciona al menos un participante';
      }
    } catch (err) {
      newErrors.shares = err instanceof Error ? err.message : 'Error en la división de gastos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSaving(true);
      const shares = calculateShares();
      const numAmount = Number(amount);
      await onSave({
        title: title.trim(),
        amount: numAmount,
        payerId,
        divisionType,
        shares,
        expenseDate,
        categoryId: categoryId || undefined,
        tagIds: selectedTagIds,
      });
      if (!initialData) {
        setTitle('');
        setAmount('');
        setPayerId(members[0]?.id || '');
        setDivisionType('equal');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setCategoryId('');
        setSelectedTagIds([]);
        setCustomShares({});
        setSelectedMemberIds(members.map(member => member.id));
      }
      setErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el gasto';
      if (errorMessage.includes('porcentajes') || errorMessage.includes('cantidades') || errorMessage.includes('sumar')) {
        setErrors(prev => ({ ...prev, shares: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, title: errorMessage }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId],
    );
  };

  const selectAllParticipants = () => {
    setSelectedMemberIds(members.map(member => member.id));
  };

  const selectOnlyPayer = () => {
    if (!payerId) return;
    setSelectedMemberIds([payerId]);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  };

  const activeMembers = members.filter(member => selectedMemberIds.includes(member.id));
  let previewShares: Array<{ member_id: string; amount: number }> = [];
  let previewError: string | null = null;
  try {
    previewShares = calculateShares();
  } catch (err) {
    previewError = err instanceof Error ? err.message : 'Error en el cálculo';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Editar gasto' : 'Nuevo gasto'}</CardTitle>
        <CardDescription>Registra un nuevo gasto compartido</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Concepto" error={errors.title} required>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Ej: Cena en restaurante"
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.title
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
          </FormField>
          <FormField label="Importe" error={errors.amount} required>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: undefined }));
                }
              }}
              placeholder="0.00"
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.amount
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
          </FormField>
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
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input
              type="date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de división</label>
            <select
              value={divisionType}
              onChange={e => setDivisionType(e.target.value as DivisionType)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="equal">Igual</option>
              <option value="percentage">Por porcentajes</option>
              <option value="exact">Por cantidades exactas</option>
              <option value="shares">Por partes</option>
            </select>
          </div>
          {categories.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">Categoría</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Participantes del gasto
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Solo los seleccionados participan en el reparto.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={selectAllParticipants}>
                Todos
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={selectOnlyPayer}>
                Pagador
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {members.map(member => {
              const isSelected = selectedMemberIds.includes(member.id);
              const isPayer = member.id === payerId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleParticipant(member.id)}
                  className={`relative flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary/70 bg-primary/5'
                      : 'border-border bg-background hover:bg-muted/40'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted text-xs font-semibold">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{isPayer ? 'Pagador' : isSelected ? 'Participa' : 'No participa'}</p>
                  </div>
                  {isSelected && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
              {selectedMemberIds.length} seleccionados
            </span>
            {divisionType === 'equal' && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                Reparto igual entre seleccionados
              </span>
            )}
          </div>
        </div>

        {(divisionType === 'percentage' || divisionType === 'exact' || divisionType === 'shares') && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <label className="block text-sm font-medium">
              {divisionType === 'percentage' && 'Porcentajes (%)'}
              {divisionType === 'exact' && 'Cantidades exactas'}
              {divisionType === 'shares' && 'Partes'}
            </label>
            {errors.shares && (
              <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                {errors.shares}
              </p>
            )}
            {activeMembers.map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{member.name}</span>
                <input
                  type="number"
                  step={divisionType === 'shares' ? '1' : '0.01'}
                  value={customShares[member.id] || (divisionType === 'shares' ? '1' : '0')}
                  onChange={e => setCustomShares({ ...customShares, [member.id]: e.target.value })}
                  className="w-24 rounded border border-border bg-background px-2 py-1 text-sm"
                  placeholder={divisionType === 'shares' ? '1' : '0'}
                />
                {divisionType === 'percentage' && <span className="text-sm">%</span>}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <h4 className="mb-2 text-sm font-semibold">Cálculo en tiempo real</h4>
          {previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : previewShares.length === 0 ? (
            <p className="text-sm text-muted-foreground">Selecciona participantes e importe para ver el reparto.</p>
          ) : (
            <div className="space-y-1.5">
              {previewShares.map(share => {
                const member = members.find(m => m.id === share.member_id);
                const isPayer = share.member_id === payerId;
                return (
                  <div key={share.member_id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                    <span className="truncate">
                      {member?.name || 'Desconocido'}
                      {isPayer ? ' (pagador)' : ''}
                    </span>
                    <span className="font-semibold">{Number(share.amount).toFixed(2)} EUR</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? 'Guardando...' : 'Guardar'}
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
