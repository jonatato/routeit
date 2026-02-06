import { Link } from 'react-router-dom';
import { ArrowRight, Plane, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '../components/ui/button';

function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(217,80%,96%),_hsl(0,0%,100%)_55%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-2xl">🗺️</span>
          Routeit
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/pricing" className="text-sm text-mutedForeground hover:text-foreground">
            Precios
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex w-fit items-center rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
              Planifica. Comparte. Viaja.
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Organiza tus viajes en minutos y comparte itinerarios impecables.
            </h1>
            <p className="text-base text-mutedForeground md:text-lg">
              Routeit combina planning diario, mapas, gastos y colaboración. Empieza gratis con 2 viajes
              y desbloquea ilimitado cuando lo necesites.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/pricing">
                <Button size="lg" className="gap-2">
                  Ver planes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Entrar a mi cuenta</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-white/80 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.12)]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Itinerarios claros</p>
                  <p className="text-xs text-mutedForeground">Dias, rutas, vuelos y horarios en un solo lugar.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Gastos compartidos</p>
                  <p className="text-xs text-mutedForeground">Divide pagos y liquida de forma transparente.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Privacidad por defecto</p>
                  <p className="text-xs text-mutedForeground">Tus datos protegidos con acceso seguro.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Checklist de equipaje',
              text: 'Prepara tu maleta con listas inteligentes y personalizadas.',
            },
            {
              title: 'Recuerdos y videos',
              text: 'Guarda momentos del viaje y comparte con tu equipo.',
            },
            {
              title: 'Colaboración en tiempo real',
              text: 'Invita editores y viewers, todo sincronizado.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-sm text-mutedForeground">{item.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Landing;
