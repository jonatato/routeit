import { Link, useLocation, useNavigate } from 'react-router-dom';
import { List, MapPin, Receipt, Map, ShoppingBag } from 'lucide-react';

type Tab = {
  key: string;
  label: string;
  path?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
};

function MobileTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleMapClick = () => {
    // Si estamos en /app, hacer scroll a la sección de mapa
    if (location.pathname === '/app') {
      const mapSection = document.querySelector('#map');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Si no estamos en /app, navegar primero y luego hacer scroll
      navigate('/app');
      setTimeout(() => {
        const mapSection = document.querySelector('#map');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const tabs: Tab[] = [
    { key: 'itinerary', label: 'Itinerario', path: '/app', icon: List },
    { key: 'map', label: 'Mapa', action: handleMapClick, icon: MapPin },
    { key: 'bag', label: 'Maleta', path: '/app/bag', icon: ShoppingBag },
    { key: 'split', label: 'Gastos', path: '/app/split', icon: Receipt },
    { key: 'guide', label: 'Guía', path: '/app/guide', icon: Map },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border/20 bg-white/95 backdrop-blur-md safe-area-inset-bottom">
      <div className="mx-auto flex w-full items-center justify-around px-6 py-3">
        {tabs.map(tab => {
          const isActive = tab.path ? location.pathname === tab.path : false;
          const Icon = tab.icon;
          
          if (tab.action) {
            return (
              <button
                key={tab.key}
                onClick={tab.action}
                className="flex flex-col items-center justify-center gap-1"
              >
                <div className={`rounded-xl p-2 ${isActive ? 'bg-primary' : 'bg-transparent'}`}>
                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }
          
          return (
            <Link
              key={tab.key}
              to={tab.path!}
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

