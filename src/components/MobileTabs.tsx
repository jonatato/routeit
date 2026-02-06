import { Link, useLocation } from 'react-router-dom';
import { MapPin, Receipt, ShoppingBag, Plane, Store } from 'lucide-react';

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
    { key: 'split', label: 'Gastos', path: '/app/split', icon: Receipt },
    { key: 'bag', label: 'Maleta', path: '/app/bag', icon: ShoppingBag },
    { key: 'itinerary', label: 'Ruta', path: '/app', icon: MapPin, isCentral: true },
    { key: 'store', label: 'Tienda', path: '/app/store', icon: Store },
    { key: 'itineraries', label: 'Mis viajes', path: '/app/itineraries', icon: Plane },
  ];
  
  const isItineraryActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
      <div className="relative flex items-center justify-around px-6 py-3 pb-safe">
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
                className="flex flex-col items-center justify-center gap-1 -mt-12 relative z-10"
              >
                <div className={`rounded-full p-5 shadow-[0_8px_24px_rgba(111,99,216,0.6)] border-4 border-white ${isActive ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Icon className={`h-7 w-7 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`text-xs font-medium mt-1 ${isActive ? 'text-foreground' : 'text-gray-600'}`}>
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

