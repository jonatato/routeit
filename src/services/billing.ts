import { supabase } from '../lib/supabase';

export type BillingPlan = 'free' | 'pro';

export async function isProUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_pro_user', { user_id: userId });
  if (error) throw error;
  return Boolean(data);
}

export async function getUserPlan(userId: string): Promise<BillingPlan> {
  const isPro = await isProUser(userId);
  return isPro ? 'pro' : 'free';
}

export async function createCheckoutSession(plan: 'monthly' | 'yearly'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo crear la sesión de pago.');
  return data.url as string;
}

export async function createPortalSession(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-portal-session');
  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo abrir el portal de facturación.');
  return data.url as string;
}
