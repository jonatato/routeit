import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Coins, Plus } from 'lucide-react';
import { MobilePageHeader } from '../components/MobilePageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HeroBalance } from '../components/split/HeroBalance';
import { CurrencyConverterCard } from '../components/split/CurrencyConverterCard';
import { ExpenseCard } from '../components/split/ExpenseCard';
import { BalanceCard } from '../components/split/BalanceCard';
import { SettleDebtsDialog } from '../components/split/SettleDebtsDialog';
import { FloatingActionButton } from '../components/split/FloatingActionButton';
import { supabase } from '../lib/supabase';
import { listUserItineraries } from '../services/sharing';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../hooks/useToast';
import { TabPageSkeleton } from '../components/TabPageSkeleton';
import { canEditItineraryRole } from '../services/itinerary';
import {
  addExpense,
  addSplitMember,
  computeBalances,
  ensureSplitGroup,
  fetchSplitGroup,
  fetchSplit,
  updateExpense,
  deleteExpense,
  updateMember,
  deleteMember,
  addPayment,
  addCategory,
  addTag,
  addExpenseTags,
  removeExpenseTags,
  fetchExpenseTags,
  exportSplitData,
  type SplitMember,
  type SplitExpense,
  type SplitShare,
  type SplitPayment,
  type SplitCategory,
  type SplitTag,
  type SplitGroup,
} from '../services/split';
import { ExpenseForm } from '../components/split/ExpenseForm';
import { PaymentForm } from '../components/split/PaymentForm';
import { ExpenseDetail } from '../components/split/ExpenseDetail';
import { SplitHistory } from '../components/split/SplitHistory';
import { SplitReports } from '../components/split/SplitReports';
import { SplitCharts } from '../components/split/SplitCharts';
import { PaymentReminderNotification } from '../components/split/PaymentReminderNotification';

function Split() {
  const [isLoading, setIsLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Array<{ id: string; title: string; role: string }>>([]);
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [shares, setShares] = useState<SplitShare[]>([]);
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [categories, setCategories] = useState<SplitCategory[]>([]);
  const [tags, setTags] = useState<SplitTag[]>([]);
  const [splitGroup, setSplitGroup] = useState<SplitGroup | null>(null);
  const [newMember, setNewMember] = useState('');
  const [editingExpense, setEditingExpense] = useState<SplitExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<SplitExpense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [authUserId, setAuthUserId] = useState<string>('');
  const [authUserHints, setAuthUserHints] = useState<string[]>([]);
  const [manualCurrentMemberId, setManualCurrentMemberId] = useState<string>('');
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string | null>(null);
  const location = useLocation();
  const { subscribeToSplitwise } = useNotifications();
  const { toast } = useToast();
  const activeItinerary = useMemo(
    () => itineraries.find(itinerary => itinerary.id === activeItineraryId) ?? null,
    [activeItineraryId, itineraries],
  );
  const canManageSplit = canEditItineraryRole(activeItinerary?.role ?? null);

  const showReadOnlySplitError = useCallback(() => {
    toast.error('Solo owner y editor pueden modificar los gastos de este viaje.');
  }, [toast]);

  const ensureCanManageSplit = useCallback(() => {
    if (canManageSplit) return true;
    showReadOnlySplitError();
    return false;
  }, [canManageSplit, showReadOnlySplitError]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setIsLoading(false);
      return;
    }
    setAuthUserId(data.user.id);
    const metadata = data.user.user_metadata as Record<string, unknown> | null;
    const email = data.user.email ?? '';
    const emailPrefix = email.includes('@') ? email.split('@')[0] : email;
    const hints = [
      typeof metadata?.full_name === 'string' ? metadata.full_name : '',
      typeof metadata?.name === 'string' ? metadata.name : '',
      typeof metadata?.preferred_username === 'string' ? metadata.preferred_username : '',
      emailPrefix,
      email,
    ].filter(Boolean);
    setAuthUserHints(Array.from(new Set(hints.map(value => value.toLowerCase().trim()))));
    const dataItineraries = await listUserItineraries(data.user.id);
    const simplified = dataItineraries.map(item => ({ id: item.id, title: item.title, role: item.role }));
    setItineraries(simplified);
    const params = new URLSearchParams(location.search);
    const itineraryId = params.get('itineraryId') ?? simplified[0]?.id ?? null;
    setActiveItineraryId(itineraryId);
    setIsLoading(false);
  }, [location.search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadSplit = async () => {
      if (!activeItineraryId) {
        setGroupId(null);
        setSplitGroup(null);
        setMembers([]);
        setExpenses([]);
        setShares([]);
        setPayments([]);
        setCategories([]);
        setTags([]);
        return;
      }

      const group = canManageSplit
        ? await ensureSplitGroup(activeItineraryId)
        : await fetchSplitGroup(activeItineraryId);

      if (!group) {
        setGroupId(null);
        setSplitGroup(null);
        setMembers([]);
        setExpenses([]);
        setShares([]);
        setPayments([]);
        setCategories([]);
        setTags([]);
        return;
      }

      setGroupId(group.id);
      setSplitGroup(group);
      const data = await fetchSplit(group.id);
      setMembers(data.members);
      setExpenses(data.expenses);
      setShares(data.shares);
      setPayments(data.payments);
      setCategories(data.categories);
      setTags(data.tags);
    };
    void loadSplit();
  }, [activeItineraryId, canManageSplit]);

  // Subscribe to Splitwise changes
  useEffect(() => {
    if (!groupId) return;
    const channel = subscribeToSplitwise(groupId);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, subscribeToSplitwise]);

  const balances = useMemo(
    () => computeBalances(members, expenses, shares, payments),
    [members, expenses, shares, payments],
  );

  const normalizeMemberName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  const currentUserId = useMemo(
    () => {
      const linkedByUserId = members.find(member => member.user_id === authUserId);
      if (linkedByUserId) return linkedByUserId.id;

      const hintedMembers = members.filter(member =>
        authUserHints.includes(normalizeMemberName(member.name)),
      );
      if (hintedMembers.length === 1) return hintedMembers[0].id;

      if (members.length === 1) return members[0].id;

      return '';
    },
    [members, authUserId, authUserHints],
  );

  const effectiveCurrentUserId = currentUserId || manualCurrentMemberId;

  useEffect(() => {
    if (!groupId) {
      setManualCurrentMemberId('');
      return;
    }

    const storageKey = `split.current-member.${groupId}`;
    const storedMemberId = localStorage.getItem(storageKey);
    if (storedMemberId && members.some(member => member.id === storedMemberId)) {
      setManualCurrentMemberId(storedMemberId);
      return;
    }

    setManualCurrentMemberId('');
  }, [groupId, members]);

  useEffect(() => {
    if (!groupId || !manualCurrentMemberId) return;
    const storageKey = `split.current-member.${groupId}`;
    localStorage.setItem(storageKey, manualCurrentMemberId);
  }, [groupId, manualCurrentMemberId]);

  const handleSaveExpense = async (data: {
    title: string;
    amount: number;
    payerId: string;
    divisionType: 'equal' | 'percentage' | 'exact' | 'shares';
    shares: Array<{ member_id: string; amount: number }>;
    expenseDate?: string;
    categoryId?: string;
    tagIds: string[];
  }) => {
    if (!ensureCanManageSplit()) return;

    if (!groupId) {
      toast.error('No hay grupo seleccionado');
      return;
    }

    try {
      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          {
            title: data.title,
            amount: data.amount,
            payer_id: data.payerId,
            division_type: data.divisionType,
            expense_date: data.expenseDate,
            category_id: data.categoryId,
          },
          data.shares,
        );

        const currentTagIds = await fetchExpenseTags(editingExpense.id);
        const toRemove = currentTagIds.filter(id => !data.tagIds.includes(id));
        const toAdd = data.tagIds.filter(id => !currentTagIds.includes(id));
        if (toRemove.length > 0) await removeExpenseTags(editingExpense.id, toRemove);
        if (toAdd.length > 0) await addExpenseTags(editingExpense.id, toAdd);

        setEditingExpense(null);
        toast.success('Gasto actualizado correctamente');
      } else {
        const expense = await addExpense(
          groupId,
          data.payerId,
          data.title,
          data.amount,
          data.shares,
          data.divisionType,
          data.expenseDate,
          data.categoryId,
        );

        if (data.tagIds.length > 0) {
          await addExpenseTags(expense.id, data.tagIds);
        }

        const newShares = await supabase.from('split_shares').select('*').eq('expense_id', expense.id);
        if (!newShares.error && newShares.data) {
          setShares(prev => [...prev, ...(newShares.data as SplitShare[])]);
        }
        toast.success('Gasto creado correctamente');
      }

      await reloadData();
      setShowExpenseForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el gasto');
    }
  };

  const handleSavePayment = async (data: { payerId: string; payeeId: string; amount: number; note?: string }) => {
    if (!ensureCanManageSplit()) return;

    if (!groupId) {
      toast.error('No hay grupo seleccionado');
      return;
    }
    try {
      await addPayment(groupId, data.payerId, data.payeeId, data.amount, data.note);
      await reloadData();
      setShowPaymentForm(false);
      toast.success('Pago registrado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el pago');
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!ensureCanManageSplit()) return;
    setConfirmDeleteExpense(expenseId);
  };

  const confirmDeleteExpenseAction = async () => {
    if (!ensureCanManageSplit()) return;
    if (!confirmDeleteExpense) return;
    try {
      await deleteExpense(confirmDeleteExpense);
      await reloadData();
      setViewingExpense(null);
      toast.success('Gasto eliminado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el gasto');
    } finally {
      setConfirmDeleteExpense(null);
    }
  };

  const handleEditExpense = (expense: SplitExpense) => {
    if (!ensureCanManageSplit()) return;
    setEditingExpense(expense);
    setViewingExpense(null);
    setShowExpenseForm(true);
  };

  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);

  const handleDeleteMember = (memberId: string) => {
    if (!ensureCanManageSplit()) return;
    setConfirmDeleteMember(memberId);
  };

  const confirmDeleteMemberAction = async () => {
    if (!ensureCanManageSplit()) return;
    if (!confirmDeleteMember) return;
    try {
      await deleteMember(confirmDeleteMember);
      await reloadData();
      toast.success('Miembro eliminado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el miembro');
    } finally {
      setConfirmDeleteMember(null);
    }
  };

  const handleUpdateMember = async (memberId: string, name: string) => {
    if (!ensureCanManageSplit()) return;
    try {
      await updateMember(memberId, name);
      await reloadData();
      toast.success('Miembro actualizado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el miembro');
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!ensureCanManageSplit()) return;
    if (!groupId || !name.trim()) {
      toast.error('El nombre de la categoría no puede estar vacío');
      return;
    }
    try {
      await addCategory(groupId, name.trim());
      await reloadData();
      toast.success('Categoría creada correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la categoría');
    }
  };

  const handleAddTag = async (name: string) => {
    if (!ensureCanManageSplit()) return;
    if (!groupId || !name.trim()) {
      toast.error('El nombre del tag no puede estar vacío');
      return;
    }
    await addTag(groupId, name.trim());
    await reloadData();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!groupId) return;
    const data = await exportSplitData(groupId, format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split-export-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadData = async () => {
    if (!groupId) return;
    const data = await fetchSplit(groupId);
    setMembers(data.members);
    setExpenses(data.expenses);
    setShares(data.shares);
    setPayments(data.payments);
    setCategories(data.categories);
    setTags(data.tags);
  };

  const getExpenseShares = (expenseId: string) => {
    return shares.filter(s => s.expense_id === expenseId);
  };
  
  const editingExpenseShares = editingExpense ? getExpenseShares(editingExpense.id) : [];
  const editingCustomShares = editingExpense
    ? Object.fromEntries(
        editingExpenseShares.map(share => {
          const rawValue =
            editingExpense.division_type === 'percentage'
              ? ((Number(share.amount) / Number(editingExpense.amount || 1)) * 100).toFixed(2)
              : Number(share.amount).toFixed(2);
          const normalizedValue = rawValue.replace(/\.00$/, '');
          return [share.member_id, normalizedValue];
        }),
      )
    : {};

  if (isLoading) {
    return <TabPageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-10 pb-24 md:pb-10">
      <MobilePageHeader
        title="División de gastos"
        subtitle="Gestiona los gastos compartidos"
        backTo="/app"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')} className="w-full">
              Exportar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="w-full">
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* Header */}
      <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Volver">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              División de gastos
            </h1>
            <p className="text-sm text-mutedForeground">Gestiona los gastos compartidos del viaje.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleExport('json')}>
            Exportar JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Itinerary Selector */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">🌍 Itinerario</CardTitle>
          <CardDescription>Selecciona el viaje para gestionar sus gastos.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={activeItineraryId ?? ''}
            onChange={event => setActiveItineraryId(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {itineraries.map(itinerary => (
              <option key={itinerary.id} value={itinerary.id}>
                {itinerary.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Hero Balance */}
      <HeroBalance balances={balances} currentUserId={effectiveCurrentUserId} currency={splitGroup?.currency ?? 'EUR'} />

      {!effectiveCurrentUserId && members.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">
              No pudimos identificar tu perfil en este grupo. Selecciónalo para activar “Liquidar Deudas”.
            </p>
            <select
              value={manualCurrentMemberId}
              onChange={event => setManualCurrentMemberId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecciona tu perfil</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {!canManageSplit && activeItinerary && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
          <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-100">
            Estás en modo solo lectura. Como viewer puedes consultar gastos y balances, pero no crear, editar ni eliminar datos.
          </CardContent>
        </Card>
      )}

      {/* Settle Debts Button */}
      {canManageSplit && effectiveCurrentUserId && (
        <SettleDebtsDialog
          currentUserId={effectiveCurrentUserId}
          balances={balances}
          onSettle={async (fromId, toId, amount) => {
            if (!groupId) return;
            await addPayment(groupId, fromId, toId, amount);
            await reloadData();
          }}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted/50 p-2 sm:grid-cols-6">
          <TabsTrigger value="overview" className="w-full">Resumen</TabsTrigger>
          <TabsTrigger value="expenses" className="w-full">Gastos</TabsTrigger>
          <TabsTrigger value="payments" className="w-full">Pagos</TabsTrigger>
          <TabsTrigger value="history" className="w-full">Historial</TabsTrigger>
          <TabsTrigger value="reports" className="w-full">Reportes</TabsTrigger>
          <TabsTrigger value="currency" className="w-full gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            Divisas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {groupId && effectiveCurrentUserId && (
            <PaymentReminderNotification groupId={groupId} userId={effectiveCurrentUserId} />
          )}
          
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Participantes */}
            <Card>
              <CardHeader>
                <CardTitle>👥 Participantes</CardTitle>
                <CardDescription>Personas que comparten los gastos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map(member => {
                  const memberBalance = balances.find(b => b.member.id === member.id);
                  return (
                    <BalanceCard
                      key={member.id}
                      balance={memberBalance || { member, balance: 0 }}
                      onEdit={canManageSplit ? () => {
                        const newName = prompt('Nuevo nombre:', member.name);
                        if (newName && newName.trim() && newName !== member.name) {
                          void handleUpdateMember(member.id, newName.trim());
                        }
                      } : undefined}
                      onDelete={canManageSplit ? () => void handleDeleteMember(member.id) : undefined}
                    />
                  );
                })}
                {canManageSplit && (
                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <input
                    value={newMember}
                    onChange={event => setNewMember(event.target.value)}
                    placeholder="Nuevo participante"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && groupId && newMember.trim()) {
                        void (async () => {
                          try {
                            const member = await addSplitMember(groupId, newMember.trim());
                            setMembers(prev => [...prev, member]);
                            setNewMember('');
                            toast.success(`Miembro "${member.name}" añadido correctamente`);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Error al añadir el miembro');
                          }
                        })();
                      }
                    }}
                  />
                  <Button
                    disabled={!groupId}
                    onClick={async () => {
                      if (!groupId || !newMember.trim()) {
                        toast.error('El nombre del miembro no puede estar vacío');
                        return;
                      }
                      try {
                        const member = await addSplitMember(groupId, newMember.trim());
                        setMembers(prev => [...prev, member]);
                        setNewMember('');
                        toast.success(`Miembro "${member.name}" añadido correctamente`);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Error al añadir el miembro');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Estadísticas Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground md:text-sm">Total Gastado</div>
                      <div className="text-lg font-bold truncate sm:text-xl md:text-2xl">
                        {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} {splitGroup?.currency ?? 'EUR'}
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl flex-shrink-0 ml-2">💰</div>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground md:text-sm">Número de Gastos</div>
                      <div className="text-lg font-bold truncate sm:text-xl md:text-2xl">{expenses.length}</div>
                    </div>
                    <div className="text-3xl md:text-4xl flex-shrink-0 ml-2">📝</div>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground md:text-sm">Promedio por Gasto</div>
                      <div className="text-lg font-bold truncate sm:text-xl md:text-2xl">
                        {expenses.length > 0
                          ? (expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length).toFixed(2)
                          : '0.00'}{' '}
                        {splitGroup?.currency ?? 'EUR'}
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl flex-shrink-0 ml-2">📈</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Categorías y Etiquetas */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>🏷 Categorías</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
                {canManageSplit && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nueva categoría"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        void handleAddCategory(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input?.value.trim()) {
                        void handleAddCategory(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Añadir
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔖 Etiquetas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                      {tag.name}
                    </span>
                  ))}
                </div>
                {canManageSplit && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nueva etiqueta"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        void handleAddTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input?.value.trim()) {
                        void handleAddTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Añadir
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {showExpenseForm && canManageSplit ? (
            <ExpenseForm
              members={members}
              categories={categories}
              tags={tags}
              onSave={handleSaveExpense}
              onCancel={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
              initialData={
                editingExpense
                  ? {
                      title: editingExpense.title,
                      amount: editingExpense.amount,
                      payerId: editingExpense.payer_id,
                      divisionType: editingExpense.division_type || 'equal',
                      expenseDate: editingExpense.expense_date,
                      categoryId: editingExpense.category_id,
                      participantIds: editingExpenseShares.map(share => share.member_id),
                      customShares: editingCustomShares,
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Lista de Gastos</h3>
                  <p className="text-sm text-muted-foreground">
                    {expenses.length} {expenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}
                  </p>
                </div>
                {canManageSplit && (
                  <Button onClick={() => setShowExpenseForm(true)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Gasto
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold mb-2">No hay gastos registrados</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          {canManageSplit
                            ? 'Comienza añadiendo tu primer gasto compartido'
                            : 'Todavía no hay gastos registrados en este viaje.'}
                        </p>
                        {canManageSplit && (
                          <Button onClick={() => setShowExpenseForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Primer Gasto
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  expenses.map(expense => {
                    const payer = members.find(m => m.id === expense.payer_id);
                    const category = categories.find(c => c.id === expense.category_id);
                    const expenseShares = shares.filter(s => s.expense_id === expense.id);
                    
                    return (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        payer={payer}
                        participantsCount={expenseShares.length}
                        categoryIcon={category?.name === 'Comida' ? '🍜' : category?.name === 'Transporte' ? '🚕' : category?.name === 'Alojamiento' ? '🏨' : category?.name === 'Actividades' ? '🎫' : '📦'}
                        categoryColor={category?.name === 'Comida' ? '#f59e0b' : category?.name === 'Transporte' ? '#3b82f6' : category?.name === 'Alojamiento' ? '#ec4899' : category?.name === 'Actividades' ? '#8b5cf6' : '#6b7280'}
                        onClick={() => setViewingExpense(expense)}
                        onEdit={canManageSplit ? () => {
                          setEditingExpense(expense);
                          setShowExpenseForm(true);
                        } : undefined}
                        onDelete={canManageSplit ? () => setConfirmDeleteExpense(expense.id) : undefined}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {showPaymentForm && canManageSplit ? (
            <PaymentForm
              members={members}
              onSave={handleSavePayment}
              onCancel={() => setShowPaymentForm(false)}
            />
          ) : (
            <>
              {canManageSplit && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowPaymentForm(true)}>Registrar pago</Button>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Pagos</CardTitle>
                  <CardDescription>Historial de pagos registrados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {payments.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No hay pagos registrados</p>
                  ) : (
                    payments.map(payment => {
                      const payer = members.find(m => m.id === payment.payer_id);
                      const payee = members.find(m => m.id === payment.payee_id);
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
                        >
                          <div>
                            <span className="font-medium">{payer?.name || 'Desconocido'}</span> pagó{' '}
                            <span className="font-medium">{Number(payment.amount).toFixed(2)}</span> a{' '}
                            <span className="font-medium">{payee?.name || 'Desconocido'}</span>
                            {payment.note && <div className="text-xs text-muted-foreground mt-1">{payment.note}</div>}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <SplitHistory expenses={expenses} payments={payments} members={members} categories={categories} />
        </TabsContent>

        <TabsContent value="reports">
          <SplitCharts expenses={expenses} categories={categories} />
          <div className="mt-4">
            <SplitReports
              expenses={expenses}
              members={members}
              categories={categories}
              payments={payments}
              groupName={itineraries.find(i => i.id === activeItineraryId)?.title || 'Grupo'}
            />
          </div>
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <CurrencyConverterCard
            defaultFromCurrency={splitGroup?.currency ?? 'EUR'}
            storageKey={groupId ? `routeit:currency-pref:split:${groupId}` : 'routeit:currency-pref:split'}
          />
        </TabsContent>
      </Tabs>

      {viewingExpense && (
        <ExpenseDetail
          expense={viewingExpense}
          members={members}
          categories={categories}
          tags={tags}
          shares={getExpenseShares(viewingExpense.id)}
          onClose={() => setViewingExpense(null)}
          onEdit={canManageSplit ? () => handleEditExpense(viewingExpense) : undefined}
          onDelete={canManageSplit ? () => handleDeleteExpense(viewingExpense.id) : undefined}
          canManage={canManageSplit}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteExpense !== null}
        title="Eliminar gasto"
        message="¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteExpenseAction}
        onCancel={() => setConfirmDeleteExpense(null)}
      />

      <ConfirmDialog
        isOpen={confirmDeleteMember !== null}
        title="Eliminar miembro"
        message="¿Estás seguro de que quieres eliminar este miembro? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteMemberAction}
        onCancel={() => setConfirmDeleteMember(null)}
      />
      
      {/* FAB for mobile - Add expense quickly */}
      {canManageSplit && activeTab === 'expenses' && !showExpenseForm && (
        <FloatingActionButton
          onClick={() => setShowExpenseForm(true)}
          label="Añadir gasto"
        />
      )}
    </div>
  );
}

export default Split;
