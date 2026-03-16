import { useEffect, useMemo, useState } from 'react';

type TripCountdownProps = {
  targetDate: Date;
  className?: string;
  compact?: boolean;
};

type TimeLeft = {
  days: number;
  hours: number;
  seconds: number;
  isOver: boolean;
};

const getTimeLeft = (targetDate: Date): TimeLeft => {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, seconds: 0, isOver: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const seconds = totalSeconds % 60;

  return { days, hours, seconds, isOver: false };
};

const AnimatedCounter = ({ label, value }: { label: string; value: number }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = window.setTimeout(() => setAnimate(false), 420);
    return () => window.clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative flex min-w-[86px] flex-col items-center rounded-xl border border-primary/20 bg-gradient-to-b from-card to-muted/40 px-2 py-2 shadow-sm md:min-w-[106px] md:rounded-2xl md:px-4 md:py-3">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/5" />
      <span
        className={`relative bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-3xl font-extrabold leading-none text-transparent tabular-nums transition-transform duration-500 md:text-5xl ${animate ? 'scale-110' : 'scale-100'}`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="relative mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-mutedForeground md:mt-2 md:text-[11px] md:tracking-[0.16em]">{label}</span>
      <span className="relative mt-1 h-1 w-6 rounded-full bg-gradient-to-r from-primary to-accent md:mt-2 md:w-8" />
    </div>
  );
};

const CompactValue = ({ value, suffix }: { value: string; suffix: string }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = window.setTimeout(() => setAnimate(false), 300);
    return () => window.clearTimeout(timeout);
  }, [value]);

  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary/20 bg-background/80 px-2 py-0.5 tabular-nums transition-transform duration-300 ${animate ? 'scale-105' : 'scale-100'}`}
    >
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-sm font-extrabold leading-none text-transparent">
        {value}
      </span>
      <span className="ml-0.5 text-[10px] font-semibold text-mutedForeground">{suffix}</span>
    </span>
  );
};

export function TripCountdown({ targetDate, className, compact = false }: TripCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  const countdownItems = useMemo(
    () => [
      { label: 'Días', value: timeLeft.days },
      { label: 'Horas', value: timeLeft.hours },
      { label: 'Segundos', value: timeLeft.seconds },
    ],
    [timeLeft.days, timeLeft.hours, timeLeft.seconds],
  );

  if (timeLeft.isOver) {
    return null;
  }

  if (compact) {
    return (
      <div className={`inline-flex w-full max-w-full flex-nowrap items-center justify-between gap-2 overflow-hidden rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-accent/10 px-3 py-1.5 shadow-sm ${className ?? ''}`}>
        <span className="whitespace-nowrap text-xs font-semibold text-primary">Empieza en</span>
        <div className="flex flex-nowrap items-center gap-1 whitespace-nowrap">
          <CompactValue value={String(timeLeft.days)} suffix="d" />
          <span className="text-xs text-mutedForeground">·</span>
          <CompactValue value={String(timeLeft.hours).padStart(2, '0')} suffix="h" />
          <span className="text-xs text-mutedForeground">·</span>
          <CompactValue value={String(timeLeft.seconds).padStart(2, '0')} suffix="s" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-card to-muted/60 p-3 md:p-4 ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/50 animate-[heartbeat-ring_1.35s_ease-in-out_infinite] md:h-52 md:w-52" />
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/40 animate-[heartbeat-ring_1.35s_ease-in-out_infinite] [animation-delay:220ms] md:h-64 md:w-64" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-xl animate-[heartbeat-glow_1.35s_ease-in-out_infinite]" />
      </div>

      <div className="relative space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Cuenta atrás</p>
        <p className="text-sm text-mutedForeground">Tu viaje comienza en:</p>

        <div className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto md:gap-3 md:overflow-visible">
          {countdownItems.map(item => (
            <AnimatedCounter key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TripCountdown;