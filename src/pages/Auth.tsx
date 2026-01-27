import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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

  if (hasSession) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-12 bg-gradient-to-br from-[hsl(255,100%,98%)] via-[hsl(255,60%,96%)] to-[hsl(258,70%,94%)]">
      <div className="mb-6">
        <PandaLogo size="2xl" showText className="text-3xl" />
      </div>
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader>
          <CardTitle>Acceso</CardTitle>
          <CardDescription>Inicia sesión para editar tu itinerario dinámico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              type="email"
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
          {status && <p className="text-sm text-mutedForeground">{status}</p>}
          <div className="grid gap-2">
            <Button onClick={handleLogin} disabled={isBusy || !email || !password}>
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Auth;
