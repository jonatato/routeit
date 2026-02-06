import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setIsBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
    }
    setIsBusy(false);
  };

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Card className="w-full max-w-md border border-border bg-card shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
          <CardDescription>Elige una nueva contraseña para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={event => setConfirm(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm shadow-sm"
            />
          </div>
          <Button onClick={handleReset} disabled={isBusy} className="w-full">
            {isBusy ? 'Actualizando...' : 'Guardar contraseña'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPassword;
