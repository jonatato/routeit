import { supabase } from '../lib/supabase';
import { addExpense, ensureSplitGroup, fetchSplit } from './split';

/**
 * Crea un gasto en Split automáticamente desde una actividad del itinerario
 */
export async function createExpenseFromActivity(
  scheduleItemId: string,
  itineraryId: string,
  activityTitle: string,
  cost: number,
  costCurrency: string,
  payerId: string,
  divisionType: 'equal' | 'percentage' | 'exact' | 'shares' = 'equal',
): Promise<string> {
  // Reuse existing active linked expense if present to avoid duplicates.
  const { data: existingLinked, error: existingLinkedError } = await supabase
    .from('split_expenses')
    .select('id')
    .eq('schedule_item_id', scheduleItemId)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingLinkedError) {
    console.error('Error checking existing linked expense:', existingLinkedError);
  }

  if (existingLinked?.id) {
    const { error: relinkError } = await supabase
      .from('schedule_items')
      .update({ cost_split_expense_id: existingLinked.id })
      .eq('id', scheduleItemId)
      .is('deleted_at', null);

    if (relinkError) {
      console.error('Error relinkando activity con gasto existente:', relinkError);
    }

    return existingLinked.id;
  }

  // 1. Asegurar que existe el grupo de Split para este itinerario
  const group = await ensureSplitGroup(itineraryId);
  
  // 2. Obtener todos los miembros del grupo para crear las shares
  const { members } = await fetchSplit(group.id);
  
  if (members.length === 0) {
    throw new Error('No hay miembros en el grupo de gastos. Añade miembros primero.');
  }
  
  // 3. Calcular las shares según el tipo de división
  const shares = members.map(member => ({
    member_id: member.id,
    amount: divisionType === 'equal' ? cost / members.length : 0,
  }));
  
  // 4. Crear el gasto en Split con el enlace bidireccional
  const expense = await addExpense(
    group.id,
    payerId,
    activityTitle,
    cost,
    shares,
    divisionType,
    new Date().toISOString(),
    undefined, // categoryId
    scheduleItemId, // ← Enlace bidireccional
  );
  
  // 5. Actualizar el schedule_item con el ID del gasto creado
  const { error } = await supabase
    .from('schedule_items')
    .update({ cost_split_expense_id: expense.id })
    .eq('id', scheduleItemId)
    .is('deleted_at', null);
    
  if (error) {
    console.error('Error vinculando schedule_item con expense:', error);
  }
  
  return expense.id;
}

/**
 * Actualiza un gasto existente cuando se modifica la actividad
 */
export async function syncActivityToExpense(
  expenseId: string,
  activityTitle: string,
  cost: number,
  payerId: string,
): Promise<void> {
  // Actualizar el gasto en split_expenses
  const { error: expenseError } = await supabase
    .from('split_expenses')
    .update({
      title: activityTitle,
      amount: cost,
      payer_id: payerId,
    })
    .eq('id', expenseId)
    .is('deleted_at', null);
    
  if (expenseError) throw expenseError;
  
  // Obtener el group_id del gasto
  const { data: expense, error: fetchError } = await supabase
    .from('split_expenses')
    .select('group_id, division_type')
    .eq('id', expenseId)
    .is('deleted_at', null)
    .single();
    
  if (fetchError) throw fetchError;
  
  // Recalcular shares si es división igual
  if (expense.division_type === 'equal') {
    const { data: members } = await supabase
      .from('split_members')
      .select('id')
      .eq('group_id', expense.group_id)
      .is('deleted_at', null);
      
    if (members && members.length > 0) {
      const shareAmount = cost / members.length;
      
      // Actualizar todas las shares
      const { error: sharesError } = await supabase
        .from('split_shares')
        .update({ amount: shareAmount })
        .eq('expense_id', expenseId)
        .is('deleted_at', null);
        
      if (sharesError) console.error('Error actualizando shares:', sharesError);
    }
  }
}

/**
 * Elimina el gasto asociado cuando se borra una actividad
 */
export async function deleteExpenseFromActivity(expenseId: string): Promise<void> {
  const { error } = await supabase
    .from('split_expenses')
    .delete()
    .eq('id', expenseId)
    .is('deleted_at', null);
    
  if (error) throw error;
}

/**
 * Verifica si una actividad tiene un gasto asociado
 */
export async function hasLinkedExpense(scheduleItemId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('schedule_items')
    .select('cost_split_expense_id')
    .eq('id', scheduleItemId)
    .is('deleted_at', null)
    .single();
    
  if (error) return false;
  return !!data?.cost_split_expense_id;
}

/**
 * Obtiene el nombre de un miembro por su ID
 */
export async function getMemberName(memberId: string): Promise<string> {
  const { data, error } = await supabase
    .from('split_members')
    .select('name')
    .eq('id', memberId)
    .is('deleted_at', null)
    .single();
    
  if (error || !data) return 'Desconocido';
  return data.name;
}
