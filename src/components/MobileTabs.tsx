import { Link, useLocation } from 'react-router-dom';
import { List, MapPin, Receipt, Map } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { key: 'itinerary', label: 'Itinerario', path: '/app', icon: List },
  { key: 'map', label: 'Mapa', path: '/app#map', icon: MapPin },
  { key: 'split', label: 'Gastos', path: '/app/split', icon: Receipt },
  { key: 'guide', label: 'Guía', path: '/app/guide', icon: Map },
];

function MobileTabs() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border/20 bg-white/95 backdrop-blur-md safe-area-inset-bottom">
      <div className="mx-auto flex w-full items-center justify-around px-6 py-3">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path || (tab.path.includes('#') && location.hash === tab.path.split('#')[1]);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-1"
            >
              <div className={`rounded-xl p-2 ${isActive ? 'bg-primary' : 'bg-transparent'}`}>
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabs;

