import { supabase } from '../lib/supabase';

type ResolveMapsResponse = {
  url?: string;
  lat?: number;
  lng?: number;
};

export async function resolveMapsUrl(url: string): Promise<ResolveMapsResponse | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return null;
  }
  const { data, error } = await supabase.functions.invoke('resolve-maps', {
    body: { url: trimmed },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (error) {
    return null;
  }
  return (data as ResolveMapsResponse) ?? null;
}
