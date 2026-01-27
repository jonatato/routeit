import { Link, useLocation } from 'react-router-dom';
import { List, Receipt, ShoppingBag, Plane, Settings } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

function MobileTabs() {
  const location = useLocation();

  const tabs: Tab[] = [
    { key: 'itinerary', label: 'Inicio', path: '/app', icon: List },
    { key: 'admin', label: 'Admin', path: '/app/admin', icon: Settings },
    { key: 'split', label: 'Gastos', path: '/app/split', icon: Receipt },
    { key: 'bag', label: 'Maleta', path: '/app/bag', icon: ShoppingBag },
    { key: 'itineraries', label: 'Mis viajes', path: '/app/itineraries', icon: Plane },
  ];
  
  const isItineraryActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border/20 bg-white/95 backdrop-blur-md safe-area-inset-bottom">
      <div className="mx-auto flex w-full items-center justify-around px-6 py-3">
        {tabs.map(tab => {
          const isActive = tab.key === 'itinerary' 
            ? isItineraryActive()
            : location.pathname === tab.path;
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

