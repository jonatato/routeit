import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Luggage, PiggyBank, Route, User } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isCentral?: boolean;
};

const tabs: Tab[] = [
  { key: 'private', label: 'Privado', path: '/app/private', icon: LayoutGrid },
  { key: 'itinerary', label: 'Itinerario', path: '/app', icon: Route, isCentral: true },
  { key: 'bag', label: 'Maleta', path: '/app/bag', icon: Luggage },
  { key: 'split', label: 'Split', path: '/app/split', icon: PiggyBank },
  { key: 'profile', label: 'Perfil', path: '/app/profile', icon: User },
];

function MobileTabs() {
  const location = useLocation();
  const centralTab = tabs.find(tab => tab.isCentral);
  const otherTabs = tabs.filter(tab => !tab.isCentral);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-white/90 shadow-[0_-6px_24px_rgba(111,99,216,0.15)] backdrop-blur-md">
      <div className="mx-auto flex w-full  items-end px-3 py-2">
        <div className="grid w-full grid-cols-5 items-end gap-1">
          {/* Tabs izquierdos */}
          {otherTabs.slice(0, 2).map(tab => {
            const active = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs ${
                  active ? 'text-primary' : 'text-mutedForeground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
          
          {/* Botón central */}
          {centralTab && (
            <Link
              to={centralTab.path}
              className="flex flex-col items-center justify-center gap-1 -mb-2"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-white shadow-[0_12px_30px_rgba(111,99,216,0.35)] transition-all ${
                  location.pathname === centralTab.path
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-primary/90 text-primary-foreground scale-100'
                }`}
              >
                <centralTab.icon className="h-7 w-7" />
              </div>
              <span className={`text-[10px] font-semibold ${
                location.pathname === centralTab.path ? 'text-foreground' : 'text-mutedForeground'
              }`}>
                {centralTab.label}
              </span>
            </Link>
          )}
          
          {/* Tabs derechos */}
          {otherTabs.slice(2).map(tab => {
            const active = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs ${
                  active ? 'text-primary' : 'text-mutedForeground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default MobileTabs;

