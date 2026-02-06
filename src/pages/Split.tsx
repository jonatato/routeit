import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HeroBalance } from '../components/split/HeroBalance';
import { ExpenseCard } from '../components/split/ExpenseCard';
import { BalanceCard } from '../components/split/BalanceCard';
import { SettleDebtsDialog } from '../components/split/SettleDebtsDialog';
import { FloatingActionButton } from '../components/split/FloatingActionButton';
import { supabase } from '../lib/supabase';
import { listUserItineraries } from '../services/sharing';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../hooks/useToast';
import FullscreenLoader from '../components/FullscreenLoader';
import {
  addExpense,
  addSplitMember,
  computeBalances,
  ensureSplitGroup,
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
} from '../services/split';
import { ExpenseForm } from '../components/split/ExpenseForm';
import { PaymentForm } from '../components/split/PaymentForm';
import { DebtSimplification } from '../components/split/DebtSimplification';
import { ExpenseDetail } from '../components/split/ExpenseDetail';
import { SplitHistory } from '../components/split/SplitHistory';
import { SplitReports } from '../components/split/SplitReports';
import { SplitCharts } from '../components/split/SplitCharts';
import { PaymentReminderNotification } from '../components/split/PaymentReminderNotification';

function Split() {
  const [isLoading, setIsLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Array<{ id: string; title: string }>>([]);
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [shares, setShares] = useState<SplitShare[]>([]);
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [categories, setCategories] = useState<SplitCategory[]>([]);
  const [tags, setTags] = useState<SplitTag[]>([]);
  const [newMember, setNewMember] = useState('');
  const [editingExpense, setEditingExpense] = useState<SplitExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<SplitExpense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string | null>(null);
  const location = useLocation();
  const { subscribeToSplitwise } = useNotifications();
  const { toast } = useToast();

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setIsLoading(false);
      return;
    }
    setCurrentUserId(data.user.id);
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
      setPayments(data.payments);
      setCategories(data.categories);
      setTags(data.tags);
    };
    void loadSplit();
  }, [activeItineraryId]);

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

  const handleSaveExpense = async (data: {
    title: string;
    amount: number;
    payerId: string;
    divisionType: 'equal' | 'percentage' | 'exact' | 'shares';
    shares: Array<{ member_id: string; amount: number }>;
    expenseDate?: string;
    categoryId?: string;
    tagIds: string[];
    receiptFile?: File;
  }) => {
    if (!groupId) {
      toast.error('No hay grupo seleccionado');
      return;
    }

    try {
      let receiptUrl: string | undefined;

      if (data.receiptFile) {
        const fileExt = data.receiptFile.name.split('.').pop();
        const fileName = `${groupId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('split-receipts')
          .upload(fileName, data.receiptFile);
        if (uploadError) {
          toast.error('Error al subir la imagen: ' + uploadError.message);
          return;
        }
        const { data: urlData } = supabase.storage.from('split-receipts').getPublicUrl(fileName);
        receiptUrl = urlData.publicUrl;
      }

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
            receipt_url: receiptUrl,
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

        if (receiptUrl) {
          await supabase
            .from('split_expenses')
            .update({ receipt_url: receiptUrl })
            .eq('id', expense.id);
        }

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
    setConfirmDeleteExpense(expenseId);
  };

  const confirmDeleteExpenseAction = async () => {
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
    setEditingExpense(expense);
    setViewingExpense(null);
    setShowExpenseForm(true);
  };

  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);

  const handleDeleteMember = (memberId: string) => {
    setConfirmDeleteMember(memberId);
  };

  const confirmDeleteMemberAction = async () => {
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
    try {
      await updateMember(memberId, name);
      await reloadData();
      toast.success('Miembro actualizado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el miembro');
    }
  };

  const handleAddCategory = async (name: string) => {
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

  if (isLoading) {
    return <FullscreenLoader message="Cargando division de gastos..." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
      <HeroBalance balances={balances} currentUserId={currentUserId} />

      {/* Settle Debts Button */}
      {currentUserId && (
        <SettleDebtsDialog
          currentUserId={currentUserId}
          balances={balances}
          onSettle={async (fromId, toId, amount) => {
            if (!groupId) return;
            await addPayment(groupId, fromId, toId, amount);
            await reloadData();
          }}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 gap-2 bg-muted/50 p-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {groupId && currentUserId && (
            <PaymentReminderNotification groupId={groupId} userId={currentUserId} />
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
                      onEdit={() => {
                        const newName = prompt('Nuevo nombre:', member.name);
                        if (newName && newName.trim() && newName !== member.name) {
                          void handleUpdateMember(member.id, newName.trim());
                        }
                      }}
                      onDelete={() => void handleDeleteMember(member.id)}
                    />
                  );
                })}
                <div className="flex flex-col gap-2 sm:flex-row pt-4">
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
                        {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} EUR
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
                        EUR
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {showExpenseForm ? (
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
                <Button onClick={() => setShowExpenseForm(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              </div>
              
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold mb-2">No hay gastos registrados</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Comienza añadiendo tu primer gasto compartido
                        </p>
                        <Button onClick={() => setShowExpenseForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Añadir Primer Gasto
                        </Button>
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
                        onEdit={() => {
                          setEditingExpense(expense);
                          setShowExpenseForm(true);
                        }}
                        onDelete={() => setConfirmDeleteExpense(expense.id)}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {showPaymentForm ? (
            <PaymentForm
              members={members}
              onSave={handleSavePayment}
              onCancel={() => setShowPaymentForm(false)}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setShowPaymentForm(true)}>Registrar pago</Button>
              </div>
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
      </Tabs>

      {viewingExpense && (
        <ExpenseDetail
          expense={viewingExpense}
          members={members}
          categories={categories}
          tags={tags}
          shares={getExpenseShares(viewingExpense.id)}
          onClose={() => setViewingExpense(null)}
          onEdit={() => handleEditExpense(viewingExpense)}
          onDelete={() => handleDeleteExpense(viewingExpense.id)}
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
      {activeTab === 'expenses' && !showExpenseForm && (
        <FloatingActionButton
          onClick={() => setShowExpenseForm(true)}
          label="Añadir gasto"
        />
      )}
    </div>
  );
}

export default Split;

