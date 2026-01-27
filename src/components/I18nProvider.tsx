import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUserPreferences } from '../services/userPreferences';
import { supabase } from '../lib/supabase';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const prefs = await fetchUserPreferences(user.id);
        if (prefs?.language) {
          i18n.changeLanguage(prefs.language);
        }
      }
    };
    void loadLanguage();
  }, [i18n]);

  return <>{children}</>;
}
