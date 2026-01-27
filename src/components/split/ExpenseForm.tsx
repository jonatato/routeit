import { useState } from 'react';
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
    receiptFile?: File;
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
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; amount?: string; shares?: string }>({});

  const calculateShares = (): Array<{ member_id: string; amount: number }> => {
    const totalAmount = Number(amount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return [];

    if (divisionType === 'equal') {
      return members.map(member => ({ member_id: member.id, amount: totalAmount / members.length }));
    }

    if (divisionType === 'percentage') {
      const totalPercentage = members.reduce((sum, member) => {
        const pct = Number(customShares[member.id] || 0);
        return sum + pct;
      }, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Los porcentajes deben sumar 100%');
      }
      return members.map(member => ({
        member_id: member.id,
        amount: (totalAmount * Number(customShares[member.id] || 0)) / 100,
      }));
    }

    if (divisionType === 'exact') {
      const totalExact = members.reduce((sum, member) => {
        const exact = Number(customShares[member.id] || 0);
        return sum + exact;
      }, 0);
      if (Math.abs(totalExact - totalAmount) > 0.01) {
        throw new Error(`Las cantidades deben sumar ${totalAmount.toFixed(2)}`);
      }
      return members.map(member => ({
        member_id: member.id,
        amount: Number(customShares[member.id] || 0),
      }));
    }

    if (divisionType === 'shares') {
      const totalShares = members.reduce((sum, member) => {
        const shares = Number(customShares[member.id] || 1);
        return sum + shares;
      }, 0);
      return members.map(member => {
        const shares = Number(customShares[member.id] || 1);
        return { member_id: member.id, amount: (totalAmount * shares) / totalShares };
      });
    }

    return [];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        newErrors.shares = 'Debe haber al menos un miembro';
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
        receiptFile: receiptFile || undefined,
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
        setReceiptFile(null);
        setReceiptPreview(null);
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
            {members.map(member => (
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

        <div>
          <label className="mb-2 block text-sm font-medium">Recibo/Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {receiptPreview && (
            <div className="mt-2">
              <img src={receiptPreview} alt="Vista previa" className="max-w-xs rounded border" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReceiptFile(null);
                  setReceiptPreview(null);
                }}
                className="mt-2"
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>

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
