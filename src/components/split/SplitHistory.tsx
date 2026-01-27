import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { SplitExpense, SplitPayment, SplitMember, SplitCategory } from '../../services/split';

type SplitHistoryProps = {
  expenses: SplitExpense[];
  payments: SplitPayment[];
  members: SplitMember[];
  categories: SplitCategory[];
};

type HistoryItem = {
  id: string;
  type: 'expense' | 'payment';
  date: string;
  title: string;
  amount: number;
  member?: string;
  category?: string;
};

export function SplitHistory({ expenses, payments, members, categories }: SplitHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMember, setFilterMember] = useState('');

  const historyItems: HistoryItem[] = useMemo(() => {
    const items: HistoryItem[] = [];

    expenses.forEach(expense => {
      const payer = members.find(m => m.id === expense.payer_id);
      const category = categories.find(c => c.id === expense.category_id);
      items.push({
        id: expense.id,
        type: 'expense',
        date: expense.expense_date || expense.created_at,
        title: expense.title,
        amount: Number(expense.amount),
        member: payer?.name,
        category: category?.name,
      });
    });

    payments.forEach(payment => {
      const payer = members.find(m => m.id === payment.payer_id);
      const payee = members.find(m => m.id === payment.payee_id);
      items.push({
        id: payment.id,
        type: 'payment',
        date: payment.created_at,
        title: `Pago: ${payer?.name || ''} → ${payee?.name || ''}`,
        amount: Number(payment.amount),
        member: payer?.name,
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, payments, members, categories]);

  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterMember && item.member !== filterMember) return false;
      return true;
    });
  }, [historyItems, searchTerm, filterCategory, filterMember]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial</CardTitle>
        <CardDescription>Historial completo de gastos y pagos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos los miembros</option>
            {members.map(member => (
              <option key={member.id} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay elementos en el historial</p>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-lg border border-border px-3 py-2 ${
                  item.type === 'payment' ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.category && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">{item.category}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(item.date).toLocaleDateString('es-ES')}</span>
                    {item.member && <span>• {item.member}</span>}
                  </div>
                </div>
                <span className={`font-semibold ${item.type === 'payment' ? 'text-emerald-600' : ''}`}>
                  {item.type === 'payment' ? '+' : ''}
                  {item.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
