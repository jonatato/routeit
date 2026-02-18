import type { ReactNode } from 'react';
import Lottie from 'lottie-react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  MapPinned,
  PlusCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import globeAnimation from '../assets/lottie/globe.json';

type ItineraryTutorialProps = {
  title?: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
};

const steps = [
  {
    title: 'Crea el viaje',
    description: 'Elige nombre, fechas y un objetivo para el viaje.',
    bullets: ['Nombre + fechas', 'Objetivo del viaje'],
    accent: 'from-amber-400/20 via-amber-200/10 to-transparent',
    icon: PlusCircle,
  },
  {
    title: 'Define ciudades y dias',
    description: 'Agrega destinos y reparte el plan por dia.',
    bullets: ['Destinos clave', 'Orden por dia'],
    accent: 'from-emerald-400/20 via-emerald-200/10 to-transparent',
    icon: MapPinned,
  },
  {
    title: 'Agenda actividades',
    description: 'Completa vuelos, notas, presupuesto y checklist.',
    bullets: ['Vuelos y traslados', 'Notas y presupuesto'],
    accent: 'from-sky-400/20 via-sky-200/10 to-transparent',
    icon: CalendarDays,
  },
  {
    title: 'Comparte con tu equipo',
    description: 'Invita editores o comparte el enlace del viaje.',
    bullets: ['Invitaciones rapidas', 'Link listo para enviar'],
    accent: 'from-violet-400/20 via-violet-200/10 to-transparent',
    icon: Share2,
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ItineraryTutorial({
  title = 'Tu primer viaje en 4 pasos',
  description = 'Sigue estos pasos y tendras un plan listo en minutos.',
  primaryAction,
  secondaryAction,
}: ItineraryTutorialProps) {
  return (
    <div className="w-full max-w-6xl">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-white via-white to-primary/10 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />

        <LazyMotion features={domAnimation}>
          <m.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="relative flex flex-col gap-8 text-left"
          >
            <m.div variants={itemVariants} className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mutedForeground">
                Tutorial visual
              </p>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h2>
              <p className="text-sm text-mutedForeground max-w-2xl">{description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-mutedForeground">
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Listo en menos de 2 minutos
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Guardado automatico
                </div>
              </div>

              {(primaryAction || secondaryAction) && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {primaryAction}
                  {secondaryAction}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-white/80 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-200/30" />
              <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="h-40 w-40">
                  <Lottie animationData={globeAnimation} loop />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Tu viaje toma forma</p>
                  <p className="text-xs text-mutedForeground">
                    Ve los dias y actividades ordenados en un vistazo.
                  </p>
                </div>
              </div>
            </div>
            </m.div>

            <m.div variants={containerVariants} className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <m.div key={step.title} variants={itemVariants}>
                  <div className="relative h-full overflow-hidden rounded-2xl border border-border/70 bg-white/90 p-4">
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.accent}`} />
                    <div className="relative flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-xs font-semibold text-mutedForeground">
                          Paso {index + 1}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        <p className="text-sm text-mutedForeground">{step.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-mutedForeground">
                        {step.bullets.map(bullet => (
                          <span
                            key={bullet}
                            className="rounded-full border border-border/70 bg-white/70 px-2.5 py-1"
                          >
                            {bullet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </m.div>
              );
            })}
            </m.div>

            <m.div
              variants={itemVariants}
              className="rounded-2xl border border-dashed border-border/70 bg-white/70 p-4 text-sm text-mutedForeground"
            >
              Tip: puedes crear un viaje basico en menos de 2 minutos y completarlo mas adelante.
            </m.div>
          </m.div>
        </LazyMotion>
      </div>
    </div>
  );
}
