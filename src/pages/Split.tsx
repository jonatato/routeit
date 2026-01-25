import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { listUserItineraries } from '../services/sharing';
import { addExpense, addSplitMember, computeBalances, ensureSplitGroup, fetchSplit } from '../services/split';

function Split() {
  const [isLoading, setIsLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Array<{ id: string; title: string }>>([]);
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ id: string; title: string; amount: number; payer_id: string }>>([]);
  const [shares, setShares] = useState<Array<{ expense_id: string; member_id: string; amount: number }>>([]);
  const [newMember, setNewMember] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const location = useLocation();

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setIsLoading(false);
      return;
    }
    const dataItineraries = await listUserItineraries(data.user.id);
    const simplified = dataItineraries.map(item => ({ id: item.id, title: item.title }));
    setItineraries(simplified);
    const params = new URLSearchParams(location.search);
    const itineraryId = params.get('itineraryId') ?? simplified[0]?.id ?? null;
    setActiveItineraryId(itineraryId);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, [location.search]);

  useEffect(() => {
    const loadSplit = async () => {
      if (!activeItineraryId) return;
      const group = await ensureSplitGroup(activeItineraryId);
      setGroupId(group.id);
      const data = await fetchSplit(group.id);
      setMembers(data.members);
      setExpenses(data.expenses);
      setShares(data.shares);
      if (!expensePayer && data.members.length > 0) {
        setExpensePayer(data.members[0].id);
      }
    };
    void loadSplit();
  }, [activeItineraryId]);

  const balances = useMemo(
    () => computeBalances(members, expenses, shares),
    [members, expenses, shares],
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">Cargando split...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Split</h1>
          <p className="text-sm text-mutedForeground">Divide gastos del itinerario.</p>
        </div>
        <Link to="/app/private">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itinerario</CardTitle>
          <CardDescription>Selecciona el itinerario del split.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={activeItineraryId ?? ''}
            onChange={event => setActiveItineraryId(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {itineraries.map(itinerary => (
              <option key={itinerary.id} value={itinerary.id}>
                {itinerary.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>Quién está en el split.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                {member.name}
              </div>
            ))}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newMember}
                onChange={event => setNewMember(event.target.value)}
                placeholder="Nuevo participante"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                disabled={!groupId}
                onClick={async () => {
                  if (!groupId || !newMember.trim()) return;
                  const member = await addSplitMember(groupId, newMember.trim());
                  setMembers(prev => [...prev, member]);
                  setNewMember('');
                }}
              >
                Añadir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Quién debe a quién.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {balances.map(({ member, balance }) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{member.name}</span>
                <span className={balance >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {balance.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo gasto</CardTitle>
          <CardDescription>Reparto igualitario entre participantes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <input
            value={expenseTitle}
            onChange={event => setExpenseTitle(event.target.value)}
            placeholder="Concepto"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={expenseAmount}
            onChange={event => setExpenseAmount(event.target.value)}
            placeholder="Importe"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={expensePayer}
            onChange={event => setExpensePayer(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <Button
            className="md:col-span-3"
            disabled={!groupId}
            onClick={async () => {
              if (!groupId || !expenseTitle.trim() || !expenseAmount || !expensePayer || members.length === 0) return;
              const amount = Number(expenseAmount);
              if (!Number.isFinite(amount) || amount <= 0) return;
              const perPerson = amount / members.length;
              const expense = await addExpense(
                groupId,
                expensePayer,
                expenseTitle.trim(),
                amount,
                members.map(member => ({ member_id: member.id, amount: perPerson })),
              );
              setExpenses(prev => [expense, ...prev]);
              setShares(prev => [
                ...prev,
                ...members.map(member => ({ expense_id: expense.id, member_id: member.id, amount: perPerson })),
              ]);
              setExpenseTitle('');
              setExpenseAmount('');
            }}
          >
            Guardar gasto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
          <CardDescription>Últimos gastos añadidos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>{expense.title}</span>
              <span>{Number(expense.amount).toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default Split;
