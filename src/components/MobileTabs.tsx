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
    return location.pathname === '/app' || location.pathname.startsWith('/app?');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] safe-area-inset-bottom">
      {/* Fondo con SVG para crear una curva suave perfecta */}
      <div className="relative h-[75px]">
        {/* SVG path para la curva */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 375 75"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="-2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.1"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 0,20 L 0,75 L 375,75 L 375,20 Q 375,20 375,20 L 235,20 Q 225,20 220,15 Q 215,10 210,7 Q 200,0 187.5,0 Q 175,0 165,7 Q 160,10 155,15 Q 150,20 140,20 L 0,20 Z"
            fill="rgba(255,255,255,0.95)"
            filter="url(#shadow)"
          />
        </svg>
        
        {/* Contenedor de tabs */}
        <div className="absolute inset-0 flex items-end justify-around px-6 pb-4">
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
                  className="flex flex-col items-center justify-center gap-1 relative"
                  style={{ marginTop: '-45px' }}
                >
                  <div 
                    className={`rounded-full p-5 shadow-[0_8px_24px_rgba(111,99,216,0.6)] border-[6px] border-white transition-all duration-300 ${
                      isActive ? 'bg-primary scale-105' : 'bg-gray-100'
                    }`}
                    style={{ 
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span 
                    className={`text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-600'}`}
                    style={{ marginTop: '6px' }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            }
            
            return (
              <Link
                key={tab.key}
                to={tab.path}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
              >
                <div className={`rounded-xl p-2.5 transition-all duration-200 ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                  <Icon className={`h-6 w-6 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                </div>
                <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default MobileTabs;
