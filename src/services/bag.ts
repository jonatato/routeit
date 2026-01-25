import { supabase } from '../lib/supabase';

export type BagChecklistItem = {
  id: string;
  user_id: string;
  name: string;
  checked: boolean;
  tags: string[];
  order_index: number;
  created_at: string;
};

export async function fetchChecklist() {
  const { data, error } = await supabase
    .from('bag_checklist_items')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return (data || []) as BagChecklistItem[];
}

export async function addChecklistItem(name: string, tags: string[] = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get current max order_index
  const { data: existing } = await supabase
    .from('bag_checklist_items')
    .select('order_index')
    .eq('user_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from('bag_checklist_items')
    .insert({
      user_id: user.id,
      name,
      tags,
      order_index: orderIndex,
    })
    .select('*')
    .single();
  
  if (error) throw error;
  return data as BagChecklistItem;
}

export async function updateChecklistItem(id: string, patch: Partial<Pick<BagChecklistItem, 'name' | 'checked' | 'tags' | 'order_index'>>) {
  const { error } = await supabase
    .from('bag_checklist_items')
    .update(patch)
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteChecklistItem(id: string) {
  const { error } = await supabase
    .from('bag_checklist_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
