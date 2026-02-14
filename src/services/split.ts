import { supabase } from '../lib/supabase';

export type SplitGroup = {
  id: string;
  itinerary_id: string;
  currency: string;
};

export type SplitMember = {
  id: string;
  group_id: string;
  user_id: string | null;
  name: string;
};

export type SplitExpense = {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number;
  title: string;
  division_type?: 'equal' | 'percentage' | 'exact' | 'shares';
  expense_date?: string;
  category_id?: string;
  receipt_url?: string;
  schedule_item_id?: string; // Bidirectional link to schedule_items
  created_at: string;
};

export type SplitPayment = {
  id: string;
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  note?: string;
  created_at: string;
};

export type SplitCategory = {
  id: string;
  group_id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
};

export type SplitComment = {
  id: string;
  expense_id: string;
  member_id: string;
  comment: string;
  created_at: string;
};

export type SplitTag = {
  id: string;
  group_id: string;
  name: string;
  color?: string;
  created_at: string;
};

export type SplitNotification = {
  id: string;
  group_id: string;
  member_id: string;
  type: 'expense_added' | 'payment_received' | 'comment_added' | 'member_added';
  expense_id?: string;
  payment_id?: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type SplitPaymentReminder = {
  id: string;
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  reminder_date: string;
  note?: string;
  sent: boolean;
  created_at: string;
};

export type SplitRefund = {
  id: string;
  group_id: string;
  expense_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  note?: string;
  created_at: string;
};

export type SplitShare = {
  id: string;
  expense_id: string;
  member_id: string;
  amount: number;
};

export async function ensureSplitGroup(itineraryId: string, currency = 'EUR') {
  const existing = await supabase.from('split_groups').select('*').eq('itinerary_id', itineraryId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as SplitGroup;
  const created = await supabase
    .from('split_groups')
    .insert({ itinerary_id: itineraryId, currency })
    .select('*')
    .single();
  if (created.error) throw created.error;
  return created.data as SplitGroup;
}

export async function fetchSplit(groupId: string) {
  const members = await supabase
    .from('split_members')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (members.error) throw members.error;
  const expenses = await supabase
    .from('split_expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (expenses.error) throw expenses.error;
  const expenseIds = (expenses.data ?? []).map(row => row.id);
  const shares =
    expenseIds.length > 0
      ? await supabase.from('split_shares').select('*').in('expense_id', expenseIds)
      : await supabase.from('split_shares').select('*').limit(0);
  if (shares.error) throw shares.error;
  const payments = await fetchPayments(groupId);
  const categories = await fetchCategories(groupId);
  const tags = await fetchTags(groupId);
  return {
    members: members.data as SplitMember[],
    expenses: expenses.data as SplitExpense[],
    shares: shares.data as SplitShare[],
    payments,
    categories,
    tags,
  };
}

export async function addSplitMember(groupId: string, name: string) {
  const { data, error } = await supabase
    .from('split_members')
    .insert({ group_id: groupId, name })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitMember;
}

export async function addExpense(
  groupId: string,
  payerId: string,
  title: string,
  amount: number,
  shares: Array<{ member_id: string; amount: number }>,
  divisionType: 'equal' | 'percentage' | 'exact' | 'shares' = 'equal',
  expenseDate?: string,
  categoryId?: string,
  scheduleItemId?: string, // Enlace bidireccional
) {
  const expenseData: {
    group_id: string;
    payer_id: string;
    title: string;
    amount: number;
    division_type: 'equal' | 'percentage' | 'exact' | 'shares';
    expense_date?: string;
    category_id?: string;
    schedule_item_id?: string;
  } = {
    group_id: groupId,
    payer_id: payerId,
    title,
    amount,
    division_type: divisionType,
  };
  if (expenseDate) expenseData.expense_date = expenseDate;
  if (categoryId) expenseData.category_id = categoryId;
  if (scheduleItemId) expenseData.schedule_item_id = scheduleItemId;

  const { data, error } = await supabase
    .from('split_expenses')
    .insert(expenseData)
    .select('*')
    .single();
  if (error) throw error;
  const expense = data as SplitExpense;
  if (shares.length > 0) {
    const { error: shareError } = await supabase
      .from('split_shares')
      .insert(shares.map(share => ({ expense_id: expense.id, ...share })));
    if (shareError) throw shareError;
  }
  return expense;
}

export async function updateExpense(
  expenseId: string,
  updates: {
    title?: string;
    amount?: number;
    payer_id?: string;
    division_type?: 'equal' | 'percentage' | 'exact' | 'shares';
    expense_date?: string;
    category_id?: string;
    receipt_url?: string;
  },
  shares?: Array<{ member_id: string; amount: number }>,
) {
  const { data, error } = await supabase
    .from('split_expenses')
    .update(updates)
    .eq('id', expenseId)
    .select('*')
    .single();
  if (error) throw error;
  if (shares) {
    await supabase.from('split_shares').delete().eq('expense_id', expenseId);
    if (shares.length > 0) {
      const { error: shareError } = await supabase
        .from('split_shares')
        .insert(shares.map(share => ({ expense_id: expenseId, ...share })));
      if (shareError) throw shareError;
    }
  }
  return data as SplitExpense;
}

export async function deleteExpense(expenseId: string) {
  // Primero, buscar si hay un schedule_item vinculado
  const { data: expense, error: fetchError } = await supabase
    .from('split_expenses')
    .select('schedule_item_id')
    .eq('id', expenseId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Si hay un schedule_item vinculado, limpiar sus campos de costo
  if (expense?.schedule_item_id) {
    const { error: updateError } = await supabase
      .from('schedule_items')
      .update({
        cost: null,
        cost_currency: null,
        cost_payer_id: null,
        cost_split_expense_id: null,
      })
      .eq('id', expense.schedule_item_id);
    
    if (updateError) console.error('Error limpiando campos de costo en schedule_item:', updateError);
  }
  
  // Ahora borrar el gasto
  const { error } = await supabase.from('split_expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function updateMember(memberId: string, name: string) {
  const { data, error } = await supabase
    .from('split_members')
    .update({ name })
    .eq('id', memberId)
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitMember;
}

export async function deleteMember(memberId: string) {
  const { error } = await supabase.from('split_members').delete().eq('id', memberId);
  if (error) throw error;
}

export function computeBalances(
  members: SplitMember[],
  expenses: SplitExpense[],
  shares: SplitShare[],
  payments?: SplitPayment[],
) {
  const totals = new Map<string, number>();
  const paid = new Map<string, number>();
  members.forEach(member => {
    totals.set(member.id, 0);
    paid.set(member.id, 0);
  });
  expenses.forEach(expense => {
    paid.set(expense.payer_id, (paid.get(expense.payer_id) ?? 0) + Number(expense.amount));
  });
  shares.forEach(share => {
    totals.set(share.member_id, (totals.get(share.member_id) ?? 0) + Number(share.amount));
  });
  if (payments) {
    payments.forEach(payment => {
      paid.set(payment.payer_id, (paid.get(payment.payer_id) ?? 0) - Number(payment.amount));
      paid.set(payment.payee_id, (paid.get(payment.payee_id) ?? 0) + Number(payment.amount));
    });
  }
  return members.map(member => ({
    member,
    balance: (paid.get(member.id) ?? 0) - (totals.get(member.id) ?? 0),
  }));
}

export function simplifyDebts(balances: Array<{ member: SplitMember; balance: number }>) {
  const debts: Array<{ from: string; to: string; amount: number }> = [];
  const credits: Array<{ member: SplitMember; balance: number }> = [];
  const debits: Array<{ member: SplitMember; balance: number }> = [];

  balances.forEach(({ member, balance }) => {
    if (balance > 0) credits.push({ member, balance });
    else if (balance < 0) debits.push({ member, balance: Math.abs(balance) });
  });

  credits.sort((a, b) => b.balance - a.balance);
  debits.sort((a, b) => b.balance - a.balance);

  let creditIdx = 0;
  let debitIdx = 0;

  while (creditIdx < credits.length && debitIdx < debits.length) {
    const credit = credits[creditIdx];
    const debit = debits[debitIdx];
    const amount = Math.min(credit.balance, debit.balance);

    if (amount > 0.01) {
      debts.push({
        from: debit.member.id,
        to: credit.member.id,
        amount: Number(amount.toFixed(2)),
      });
    }

    credit.balance -= amount;
    debit.balance -= amount;

    if (credit.balance < 0.01) creditIdx++;
    if (debit.balance < 0.01) debitIdx++;
  }

  return debts;
}

export async function addPayment(
  groupId: string,
  payerId: string,
  payeeId: string,
  amount: number,
  note?: string,
) {
  const { data, error } = await supabase
    .from('split_payments')
    .insert({ group_id: groupId, payer_id: payerId, payee_id: payeeId, amount, note })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitPayment;
}

export async function fetchPayments(groupId: string) {
  const { data, error } = await supabase
    .from('split_payments')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SplitPayment[];
}

export async function addCategory(groupId: string, name: string, icon?: string, color?: string) {
  const { data, error } = await supabase
    .from('split_expense_categories')
    .insert({ group_id: groupId, name, icon, color })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitCategory;
}

export async function fetchCategories(groupId: string) {
  const { data, error } = await supabase
    .from('split_expense_categories')
    .select('*')
    .eq('group_id', groupId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SplitCategory[];
}

export async function addComment(expenseId: string, memberId: string, comment: string) {
  const { data, error } = await supabase
    .from('split_expense_comments')
    .insert({ expense_id: expenseId, member_id: memberId, comment })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitComment;
}

export async function fetchComments(expenseId: string) {
  const { data, error } = await supabase
    .from('split_expense_comments')
    .select('*')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SplitComment[];
}

export async function addTag(groupId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from('split_tags')
    .insert({ group_id: groupId, name, color })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitTag;
}

export async function fetchTags(groupId: string) {
  const { data, error } = await supabase
    .from('split_tags')
    .select('*')
    .eq('group_id', groupId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SplitTag[];
}

export async function addExpenseTags(expenseId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  const { error } = await supabase
    .from('split_expense_tags')
    .insert(tagIds.map(tagId => ({ expense_id: expenseId, tag_id: tagId })));
  if (error) throw error;
}

export async function fetchExpenseTags(expenseId: string) {
  const { data, error } = await supabase
    .from('split_expense_tags')
    .select('tag_id')
    .eq('expense_id', expenseId);
  if (error) throw error;
  return (data ?? []).map(row => row.tag_id);
}

export async function removeExpenseTags(expenseId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  const { error } = await supabase
    .from('split_expense_tags')
    .delete()
    .eq('expense_id', expenseId)
    .in('tag_id', tagIds);
  if (error) throw error;
}

export async function addNotification(
  groupId: string,
  memberId: string,
  type: 'expense_added' | 'payment_received' | 'comment_added' | 'member_added',
  message: string,
  expenseId?: string,
  paymentId?: string,
) {
  const { data, error } = await supabase
    .from('split_notifications')
    .insert({ group_id: groupId, member_id: memberId, type, message, expense_id: expenseId, payment_id: paymentId })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitNotification;
}

export async function fetchNotifications(groupId: string, memberId: string) {
  const { data, error } = await supabase
    .from('split_notifications')
    .select('*')
    .eq('group_id', groupId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SplitNotification[];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('split_notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function addPaymentReminder(
  groupId: string,
  payerId: string,
  payeeId: string,
  amount: number,
  reminderDate: string,
  note?: string,
) {
  const { data, error } = await supabase
    .from('split_payment_reminders')
    .insert({ group_id: groupId, payer_id: payerId, payee_id: payeeId, amount, reminder_date: reminderDate, note })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitPaymentReminder;
}

export async function fetchPaymentReminders(groupId: string) {
  const { data, error } = await supabase
    .from('split_payment_reminders')
    .select('*')
    .eq('group_id', groupId)
    .order('reminder_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SplitPaymentReminder[];
}

export async function addRefund(
  groupId: string,
  expenseId: string,
  payerId: string,
  payeeId: string,
  amount: number,
  note?: string,
) {
  const { data, error } = await supabase
    .from('split_refunds')
    .insert({ group_id: groupId, expense_id: expenseId, payer_id: payerId, payee_id: payeeId, amount, note })
    .select('*')
    .single();
  if (error) throw error;
  return data as SplitRefund;
}

export async function fetchRefunds(groupId: string) {
  const { data, error } = await supabase
    .from('split_refunds')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SplitRefund[];
}

export async function exportSplitData(groupId: string, format: 'csv' | 'json' = 'json') {
  const data = await fetchSplit(groupId);
  const payments = await fetchPayments(groupId);
  const categories = await fetchCategories(groupId);
  const tags = await fetchTags(groupId);

  if (format === 'json') {
    return JSON.stringify({ ...data, payments, categories, tags }, null, 2);
  }

  // CSV format
  const csvLines: string[] = [];
  csvLines.push('Type,ID,Title,Amount,Date,Payer,Category');
  data.expenses.forEach(expense => {
    const payer = data.members.find(m => m.id === expense.payer_id);
    const category = categories.find(c => c.id === expense.category_id);
    csvLines.push(
      `Expense,${expense.id},"${expense.title}",${expense.amount},${expense.expense_date || expense.created_at},"${payer?.name || ''}","${category?.name || ''}"`,
    );
  });
  payments.forEach(payment => {
    const payer = data.members.find(m => m.id === payment.payer_id);
    const payee = data.members.find(m => m.id === payment.payee_id);
    csvLines.push(
      `Payment,${payment.id},"Payment: ${payer?.name || ''} to ${payee?.name || ''}",${payment.amount},${payment.created_at},"${payer?.name || ''}",""`,
    );
  });
  return csvLines.join('\n');
}
