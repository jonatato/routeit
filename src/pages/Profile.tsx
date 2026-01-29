import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { useThemeContext } from '../components/ThemeProvider';
import { fetchUserPreferences, saveUserPreferences, updateTheme, updateLanguage } from '../services/userPreferences';
import { useTranslation } from '../hooks/useTranslation';

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useThemeContext();
  const { t, i18n } = useTranslation();
  const [preferences, setPreferences] = useState({
    language: 'es',
    notifications: true,
    emailNotifications: true,
    largeText: false,
    highContrast: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        // Cargar preferencias desde base de datos
        const dbPrefs = await fetchUserPreferences(data.user.id);
        if (dbPrefs) {
          setPreferences({
            language: dbPrefs.language,
            notifications: dbPrefs.notifications,
            emailNotifications: dbPrefs.email_notifications,
            largeText: dbPrefs.large_text,
            highContrast: dbPrefs.high_contrast,
          });
          // Sincronizar tema con el contexto
          if (dbPrefs.theme !== theme) {
            setTheme(dbPrefs.theme);
          }
        }
      }
      setIsLoading(false);
    };
    void loadUser();
  }, []);

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveUserPreferences({
        user_id: user.id,
        theme,
        language: preferences.language,
        notifications: preferences.notifications,
        email_notifications: preferences.emailNotifications,
        large_text: preferences.largeText,
        high_contrast: preferences.highContrast,
      });
      alert('Preferencias guardadas correctamente');
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Error al guardar preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (user) {
      await updateTheme(user.id, newTheme);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setPreferences({ ...preferences, language: newLanguage });
    i18n.changeLanguage(newLanguage);
    if (user) {
      await updateLanguage(user.id, newLanguage);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">No hay sesión activa</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 pb-24 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('profile.title')}</h1>
          <p className="text-sm text-mutedForeground">Gestiona tu cuenta y preferencias</p>
        </div>
        <Link to="/app">
          <Button variant="outline">{t('common.cancel')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Información de la cuenta</CardTitle>
              <CardDescription>Datos básicos de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-mutedForeground"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <CardDescription>Acciones que no se pueden deshacer</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center sm:justify-start">
          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias generales</CardTitle>
          <CardDescription>Configuración básica de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('profile.language')}</label>
            <select
              value={preferences.language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t('profile.theme')}</label>
            <select
              value={theme}
              onChange={e => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de visualización</CardTitle>
          <CardDescription>Personaliza cómo se muestra el contenido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Texto grande</label>
              <p className="text-xs text-mutedForeground">Aumenta el tamaño del texto para mejor legibilidad</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.largeText}
                onChange={e => setPreferences({ ...preferences, largeText: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Alto contraste</label>
              <p className="text-xs text-mutedForeground">Mejora el contraste para mejor visibilidad</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={e => setPreferences({ ...preferences, highContrast: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Gestiona cómo recibes notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notificaciones en la aplicación</label>
              <p className="text-xs text-mutedForeground">Recibe notificaciones dentro de la aplicación</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={e => setPreferences({ ...preferences, notifications: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notificaciones por email</label>
              <p className="text-xs text-mutedForeground">Recibe notificaciones importantes por correo electrónico</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={e => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSavePreferences} disabled={isSaving}>
          {isSaving ? t('common.loading') : t('common.save') + ' preferencias'}
        </Button>
      </div>
    </div>
  );
}

export default Profile;
