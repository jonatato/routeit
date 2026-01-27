import { supabase } from '../lib/supabase';
import type { Theme } from '../hooks/useTheme';

export type UserPreferences = {
  id?: string;
  user_id: string;
  theme: Theme;
  language: string;
  large_text: boolean;
  high_contrast: boolean;
  notifications: boolean;
  email_notifications: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }

  if (!data) {
    // Return default preferences
    return {
      user_id: userId,
      theme: 'system',
      language: 'es',
      large_text: false,
      high_contrast: false,
      notifications: true,
      email_notifications: true,
    };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    theme: (data.theme as Theme) || 'system',
    language: data.language || 'es',
    large_text: data.large_text ?? false,
    high_contrast: data.high_contrast ?? false,
    notifications: data.notifications ?? true,
    email_notifications: data.email_notifications ?? true,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveUserPreferences(preferences: Partial<UserPreferences> & { user_id: string }): Promise<UserPreferences> {
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', preferences.user_id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return data as UserPreferences;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        ...preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }
}

export async function updateTheme(userId: string, theme: Theme): Promise<void> {
  await saveUserPreferences({ user_id: userId, theme });
}

export async function updateLanguage(userId: string, language: string): Promise<void> {
  await saveUserPreferences({ user_id: userId, language });
}
