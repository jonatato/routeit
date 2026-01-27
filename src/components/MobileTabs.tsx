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
    <>
      {/* Botón central flotante - posicionado independientemente */}
      <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 z-[80]">
        {tabs.map(tab => {
          if (!tab.isCentral) return null;
          
          const isActive = isItineraryActive();
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-1"
            >
              <div 
                className={`
                  w-[68px] h-[68px] 
                  rounded-full 
                  flex items-center justify-center
                  shadow-[0_8px_32px_rgba(111,99,216,0.5)]
                  border-[5px] border-white
                  transition-all duration-300
                  ${isActive ? 'bg-primary scale-105' : 'bg-gray-100'}
                `}
              >
                <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <span 
                className={`text-xs font-semibold mt-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Barra de navegación con muesca circular */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[70] safe-area-inset-bottom bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{
          height: '65px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Muesca circular para el botón central */}
        <div 
          className="absolute -top-[35px] left-1/2 -translate-x-1/2 w-[90px] h-[90px] bg-transparent"
          style={{
            clipPath: 'circle(45px at center)'
          }}
        >
          <div className="w-full h-full bg-white"></div>
        </div>
        
        {/* Sombras para crear profundidad en la muesca */}
        <div 
          className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[100px] h-[50px]"
        >
          {/* Círculo interior para la sombra */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[95px] h-[95px] rounded-full"
            style={{
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)'
            }}
          ></div>
        </div>
        
        {/* Curvas suaves en los lados de la muesca */}
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[110px] h-[25px] overflow-hidden">
          <svg width="110" height="25" viewBox="0 0 110 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M 0,25 Q 0,0 25,0 L 85,0 Q 110,0 110,25 Z" 
              fill="white"
            />
          </svg>
        </div>
        
        {/* Contenedor de tabs laterales */}
        <div className="h-full flex items-center justify-between px-8">
          {/* Tabs izquierdos */}
          <div className="flex-1 flex justify-around items-center pr-12">
            {tabs.slice(0, 2).map(tab => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              
              return (
                <Link
                  key={tab.key}
                  to={tab.path}
                  className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
                >
                  <div className={`rounded-xl p-2 transition-all ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                    <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
          
          {/* Espacio central para el botón flotante */}
          <div className="w-[68px]"></div>
          
          {/* Tabs derechos */}
          <div className="flex-1 flex justify-around items-center pl-12">
            {tabs.slice(3).map(tab => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              
              return (
                <Link
                  key={tab.key}
                  to={tab.path}
                  className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
                >
                  <div className={`rounded-xl p-2 transition-all ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                    <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileTabs;
