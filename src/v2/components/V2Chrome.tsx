import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { activeDestination, destinationHref, DESTINATIONS, type DestinationKey } from '../navigation';

type ChromeProps = {
  base: '/app' | '/preview';
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function V2Chrome({ base, title, subtitle, children }: ChromeProps) {
  const location = useLocation();
  const current = activeDestination(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <p className="px-2 text-sm font-semibold tracking-tight">RouteIt</p>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Secciones">
            {DESTINATIONS.map(item => (
              <NavLink key={item.key} base={base} itemKey={item.key} label={item.label} current={current} />
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border px-4 py-4 md:px-8">
            <p className="text-xs text-mutedForeground">Viaje abierto</p>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-mutedForeground">{subtitle}</p>}
          </header>
          <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
        </div>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[var(--safe-area-inset-bottom)] md:hidden"
        aria-label="Secciones"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {DESTINATIONS.map(item => {
            const active = current === item.key;
            return (
              <Link
                key={item.key}
                to={destinationHref(base, item.key)}
                className={`flex items-center justify-center text-sm ${active ? 'font-semibold text-foreground' : 'text-mutedForeground'}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  base,
  itemKey,
  label,
  current,
}: {
  base: '/app' | '/preview';
  itemKey: DestinationKey;
  label: string;
  current: DestinationKey;
}) {
  const active = current === itemKey;
  return (
    <Link
      to={destinationHref(base, itemKey)}
      className={`rounded-lg px-2 py-2 text-sm ${active ? 'bg-muted font-semibold text-foreground' : 'text-mutedForeground'}`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
