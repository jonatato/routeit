import { supabase } from '../lib/supabase';

export type ExpenseDocumentType = 'receipt' | 'invoice' | 'ticket' | 'other';

export type ExpenseDocument = {
  id: string;
  expense_id: string;
  user_id: string;
  type: ExpenseDocumentType;
  title: string;
  subtitle: string | null;
  reference: string | null;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateExpenseDocumentInput = {
  expenseId: string;
  type: ExpenseDocumentType;
  title: string;
  subtitle?: string;
  reference?: string;
  url: string;
};

export type UpdateExpenseDocumentInput = {
  type?: ExpenseDocumentType;
  title?: string;
  subtitle?: string;
  reference?: string;
  url?: string;
};

async function requireUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}

const normalizeOptional = (value?: string) => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function listExpenseDocuments(expenseId: string): Promise<ExpenseDocument[]> {
  const { data, error } = await supabase
    .from('split_expense_documents')
    .select('*')
    .eq('expense_id', expenseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ExpenseDocument[];
}

export async function createExpenseDocument(
  input: CreateExpenseDocumentInput,
): Promise<ExpenseDocument> {
  const userId = await requireUserId();

  const payload = {
    expense_id: input.expenseId,
    user_id: userId,
    type: input.type,
    title: input.title.trim(),
    subtitle: normalizeOptional(input.subtitle),
    reference: normalizeOptional(input.reference),
    url: input.url.trim(),
  };

  const { data, error } = await supabase
    .from('split_expense_documents')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as ExpenseDocument;
}

export async function updateExpenseDocument(
  id: string,
  patch: UpdateExpenseDocumentInput,
): Promise<ExpenseDocument> {
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.subtitle !== undefined) payload.subtitle = normalizeOptional(patch.subtitle) ?? null;
  if (patch.reference !== undefined) payload.reference = normalizeOptional(patch.reference) ?? null;
  if (patch.url !== undefined) payload.url = patch.url.trim();

  const { data, error } = await supabase
    .from('split_expense_documents')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return data as ExpenseDocument;
}

export async function deleteExpenseDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('split_expense_documents')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw error;
}
