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
  return {
    members: members.data as SplitMember[],
    expenses: expenses.data as SplitExpense[],
    shares: shares.data as SplitShare[],
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
) {
  const { data, error } = await supabase
    .from('split_expenses')
    .insert({ group_id: groupId, payer_id: payerId, title, amount })
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

export function computeBalances(
  members: SplitMember[],
  expenses: SplitExpense[],
  shares: SplitShare[],
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
  return members.map(member => ({
    member,
    balance: (paid.get(member.id) ?? 0) - (totals.get(member.id) ?? 0),
  }));
}
