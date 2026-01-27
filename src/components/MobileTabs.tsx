import { Link, useLocation } from 'react-router-dom';
import { MapPin, Receipt, ShoppingBag, Plane, Settings } from 'lucide-react';

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
    { key: 'itinerary', label: 'Ruta', path: '/app', icon: MapPin, isCentral: true },
    { key: 'bag', label: 'Maleta', path: '/app/bag', icon: ShoppingBag },
    { key: 'itineraries', label: 'Mis viajes', path: '/app/itineraries', icon: Plane },
  ];
  
  const isItineraryActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] safe-area-inset-bottom">
      {/* Borde con muesca curva para el botón central */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-20 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" 
             style={{
               clipPath: 'polygon(0 30px, calc(50% - 50px) 30px, calc(50% - 40px) 15px, calc(50% - 30px) 5px, calc(50% - 20px) 0, calc(50% + 20px) 0, calc(50% + 30px) 5px, calc(50% + 40px) 15px, calc(50% + 50px) 30px, 100% 30px, 100% 100%, 0 100%)'
             }}>
        </div>
      </div>
      
      <div className="relative mx-auto flex w-full items-end justify-around px-6 pt-2 pb-3 bg-white/95 backdrop-blur-md">
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
                <div className={`rounded-full p-5 shadow-[0_4px_20px_rgba(111,99,216,0.5)] border-4 border-white ${isActive ? 'bg-primary' : 'bg-gray-100'}`}>
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
              className="flex flex-col items-center justify-center gap-1 mt-4"
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

