import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { createCheckoutSession, createPortalSession, getUserPlan } from '../services/billing';
import { useToast } from '../hooks/useToast';

function Pricing() {
  const [isBusy, setIsBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        setIsLoggedIn(true);
        try {
          const currentPlan = await getUserPlan(data.user.id);
          setPlan(currentPlan);
        } catch {
          setPlan('free');
        }
      }
    };
    void load();
  }, []);

  const handleCheckout = async (billing: 'monthly' | 'yearly') => {
    if (!userId) {
      toast.error('Necesitas iniciar sesión para suscribirte.');
      return;
    }
    setIsBusy(true);
    try {
      const url = await createCheckoutSession(billing);
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el pago.');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePortal = async () => {
    setIsBusy(true);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo abrir el portal.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-2xl">🗺️</span>
          Routeit
        </Link>
        <Link to="/login">
          <Button variant="outline" size="sm">Entrar</Button>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-16 pt-8">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mutedForeground">
            Precios claros
          </p>
          <h1 className="text-4xl font-semibold">Elige el plan que acompaña tu viaje</h1>
          <p className="text-sm text-mutedForeground">
            Empieza gratis con 2 itinerarios. Cuando necesites más, desbloquea Pro.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="text-sm text-mutedForeground">Ideal para organizar tus primeros viajes.</p>
            <div className="mt-4 text-3xl font-semibold">$0</div>
            <ul className="mt-5 space-y-2 text-sm text-mutedForeground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 2 itinerarios activos</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Compartir y colaborar</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Gastos y reportes</li>
            </ul>
            <div className="mt-6">
              {isLoggedIn && plan === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  Plan actual
                </Button>
              ) : !isLoggedIn ? (
                <Button variant="outline" className="w-full" disabled>
                  Empieza gratis
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Disponible en Free
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/40 bg-primary/5 p-6 shadow-[0_20px_40px_rgba(99,102,241,0.18)]">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Pro</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold">Itinerarios ilimitados</h2>
            <p className="text-sm text-mutedForeground">Para equipos o viajeros frecuentes.</p>
            <div className="mt-4 text-3xl font-semibold">$5/mes</div>
            <div className="text-xs text-mutedForeground">o $50/año</div>
            <ul className="mt-5 space-y-2 text-sm text-mutedForeground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Itinerarios ilimitados</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Prioridad en nuevas funciones</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Soporte prioritario</li>
            </ul>
            <div className="mt-6 space-y-2">
              {plan === 'pro' ? (
                <Button className="w-full" onClick={handlePortal} disabled={isBusy}>
                  Gestionar suscripción
                </Button>
              ) : (
                <>
                  <Button className="w-full" onClick={() => handleCheckout('monthly')} disabled={isBusy}>
                    Suscribirme mensual
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => handleCheckout('yearly')} disabled={isBusy}>
                    Suscribirme anual
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-mutedForeground">
          ¿Necesitas ayuda? Escríbenos y te acompañamos a elegir el plan correcto.
        </div>
      </main>
    </div>
  );
}

export default Pricing;
