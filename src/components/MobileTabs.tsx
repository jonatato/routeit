import { Link, useLocation } from 'react-router-dom';
import { List, Receipt, ShoppingBag, Plane, Settings } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isCentral?: boolean;
};

function MobileTabs() {
  const location = useLocation();

  const tabs: Tab[] = [
    { key: 'admin', label: 'Admin', path: '/app/admin', icon: Settings },
    { key: 'split', label: 'Gastos', path: '/app/split', icon: Receipt },
    { key: 'itinerary', label: 'Ruta', path: '/app', icon: List, isCentral: true },
    { key: 'bag', label: 'Maleta', path: '/app/bag', icon: ShoppingBag },
    { key: 'itineraries', label: 'Mis viajes', path: '/app/itineraries', icon: Plane },
  ];
  
  const isItineraryActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md safe-area-inset-bottom">
      {/* Borde superior con forma curvada */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-border/20">
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-20 h-8 bg-white/95 backdrop-blur-md rounded-t-[2rem] border-t border-l border-r border-border/20"></div>
      </div>
      
      <div className="mx-auto flex w-full items-end justify-around px-6 py-3">
        {tabs.map(tab => {
          const isActive = tab.key === 'itinerary' 
            ? isItineraryActive()
            : location.pathname === tab.path;
          const Icon = tab.icon;
          
          if (tab.isCentral) {
            return (
              <Link
                key={tab.key}
                to={tab.path}
                className="flex flex-col items-center justify-center gap-1 -mt-8"
              >
                <div className={`rounded-full p-4 shadow-lg ${isActive ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }
          
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

