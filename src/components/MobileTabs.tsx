import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Luggage, PiggyBank, Route } from 'lucide-react';

const tabs = [
  { key: 'itinerary', label: 'Itinerario', path: '/app', icon: Route },
  { key: 'private', label: 'Privado', path: '/app/private', icon: LayoutGrid },
  { key: 'bag', label: 'Maleta', path: '/app/bag', icon: Luggage },
  { key: 'split', label: 'Split', path: '/app/split', icon: PiggyBank },
] as const;

function MobileTabs() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-2 text-xs">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 ${
                active ? 'text-primary' : 'text-mutedForeground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabs;
