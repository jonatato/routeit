import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { PandaLogo } from '../components/PandaLogo';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
    }
    setIsBusy(false);
  };

  const handleSignUp = async () => {
    setIsBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Revisa tu correo para confirmar tu cuenta.');
    }
    setIsBusy(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setStatus('Introduce tu email para recuperar la contraseña.');
      return;
    }
    setIsBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Te enviamos un enlace para restablecer tu contraseña.');
    }
    setIsBusy(false);
  };

  if (hasSession) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-12 bg-gradient-to-br from-[hsl(255,100%,98%)] via-[hsl(255,60%,96%)] to-[hsl(258,70%,94%)]">
      <div className="mb-6">
        <PandaLogo size="2xl" showText className="text-3xl" />
      </div>
      <Card className="w-full max-w-md border border-border bg-card shadow-[0_24px_60px_rgba(111,99,216,0.22)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === 'login' ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Inicia sesión para editar tus itinerarios colaborativos.'
              : 'Regístrate para empezar a planificar tus viajes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-border bg-white px-10 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Contraseña</label>
            <div className="relative">
              <input
                value={password}
                onChange={event => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-white px-4 py-2 pr-10 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/70"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs font-medium text-mutedForeground hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
          {status && <p className="text-sm text-mutedForeground">{status}</p>}
          <div className="grid gap-2">
            {mode === 'login' ? (
              <Button onClick={handleLogin} disabled={isBusy || !email || !password}>
                Iniciar sesión
              </Button>
            ) : (
              <Button onClick={handleSignUp} disabled={isBusy || !email || !password}>
                Crear cuenta
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-mutedForeground">
            {mode === 'login' ? (
              <>
                ¿Nuevo aquí?{' '}
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() => setMode('signup')}
                >
                  Crea una cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() => setMode('login')}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Auth;
