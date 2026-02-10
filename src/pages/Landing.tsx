import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, CheckCircle2, MapPinned, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_40%,_#ffffff_75%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-2xl">🗺️</span>
          Routeit
        </div>
        <nav className="hidden items-center gap-6 text-sm text-mutedForeground md:flex">
          <a href="#features" className="transition hover:text-foreground">Funcionalidades</a>
          <a href="#how" className="transition hover:text-foreground">Como funciona</a>
          <Link to="/pricing" className="transition hover:text-foreground">Precios</Link>
          <Link to="/login" className="transition hover:text-foreground">Entrar</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="md:hidden">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
          <Link to="/pricing">
            <Button size="sm" className="hidden md:inline-flex">Crear itinerario</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-24 pt-6">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Planifica. Recuerda. Viaja.
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Tu viaje, siempre a tiempo y bajo control.
            </h1>
            <p className="text-base text-mutedForeground md:text-lg">
              Organiza los dias, revisa el dia actual y recibe recordatorios con la checklist antes de salir.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg" className="gap-2">
                  Empezar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">Ver planes</Button>
              </Link>
            </div>
          </div>
          <div className="relative rounded-[32px] border border-border bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-amber-200/60 blur-2xl md:block" />
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-amber-900">
                  <CalendarDays className="h-4 w-4" />
                  Hoy en Tokio
                </div>
                <p className="mt-2 text-xs text-amber-800">09:00 Mercado de Tsukiji · 13:00 TeamLab</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <Bell className="h-4 w-4 text-amber-600" />
                  Notificacion
                </div>
                <p className="mt-2 text-xs text-mutedForeground">Te faltan 7 dias. Revisa tu checklist.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Pasaporte</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Seguro de viaje</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Check-in vuelo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-white/70 p-6 shadow-sm md:grid-cols-3">
          {[
            { label: 'Viajes planificados', value: '2,300+' },
            { label: 'Equipos activos', value: '180+' },
            { label: 'Horas ahorradas', value: '12k' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-border bg-white p-5 text-center">
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">{item.label}</p>
            </div>
          ))}
        </section>

        <section id="features" className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: 'Vista de hoy',
              text: 'Mira el dia que toca con tareas, horarios y accesos rapidos.',
              icon: CalendarDays,
            },
            {
              title: 'Recordatorios inteligentes',
              text: 'Email 7 dias antes con tu checklist combinada.',
              icon: Sparkles,
            },
            {
              title: 'Notificaciones in-app',
              text: 'Alertas cuando hay cambios en el itinerario.',
              icon: Bell,
            },
            {
              title: 'Colaboracion real',
              text: 'Invita editores y viewers sin perder el control.',
              icon: MapPinned,
            },
          ].map(item => (
            <div key={item.title} className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <span className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                  <item.icon className="h-4 w-4" />
                </span>
                {item.title}
              </div>
              <p className="mt-3 text-sm text-mutedForeground">{item.text}</p>
            </div>
          ))}
        </section>

        <section id="how" className="grid gap-6 rounded-[28px] border border-border bg-gradient-to-br from-white via-white to-amber-50 p-8 md:grid-cols-3">
          {[
            { step: '01', title: 'Crea el itinerario', text: 'Define dias, ciudades y vuelos.' },
            { step: '02', title: 'Agrega tareas', text: 'Checklist de maleta y planes diarios.' },
            { step: '03', title: 'Comparte y recibe avisos', text: 'Notificaciones y recordatorios automaticos.' },
          ].map(item => (
            <div key={item.step} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">{item.step}</p>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-mutedForeground">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">Dia actual</p>
            <h3 className="mt-2 text-2xl font-semibold">Hoy en Bangkok</h3>
            <p className="mt-2 text-sm text-mutedForeground">Comienza el dia con la lista exacta de tareas.</p>
            <div className="mt-4 space-y-3">
              {['09:30 Palacio Real', '13:00 Street food tour', '18:00 Check-in hotel'].map(item => (
                <div key={item} className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline">Abrir vista de hoy</Button>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">Notificaciones</p>
            <h3 className="mt-2 text-2xl font-semibold">Nada se te pasa</h3>
            <p className="mt-2 text-sm text-mutedForeground">Recibe alertas y revisa cambios en segundos.</p>
            <div className="mt-4 space-y-3">
              {['Tu viaje empieza en 7 dias', 'Checklist: pasaporte, seguro', 'Actualizacion en gastos'].map(item => (
                <div key={item} className="rounded-2xl border border-border bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-white/80 p-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold">Checklist combinada</h3>
            <p className="mt-2 text-sm text-mutedForeground">Itinerario + checklist personal en el mismo recordatorio.</p>
            <ul className="mt-4 space-y-2 text-sm text-mutedForeground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Documentos y visados</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Equipaje por clima</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Reservas y tickets</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist personal</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="rounded-xl border border-border bg-white px-3 py-2">Power bank</div>
              <div className="rounded-xl border border-border bg-white px-3 py-2">Adaptador universal</div>
              <div className="rounded-xl border border-border bg-white px-3 py-2">Medicamentos</div>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-gradient-to-br from-amber-100/60 via-white to-white p-10 text-center">
          <h2 className="text-2xl font-semibold">Empieza gratis y escala cuando quieras</h2>
          <p className="text-sm text-mutedForeground">2 viajes incluidos, colaboracion total y recordatorios inteligentes.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg">Ver planes</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Entrar</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Landing;
