import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Receipt, Heart, Map as MapIcon, Plane, ShoppingBag, Settings } from 'lucide-react';

function WebSideMenu() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/app', label: 'Inicio', icon: Home },
    { path: '/app/admin', label: 'Administrar', icon: Settings },
    { path: '/app/split', label: 'Gastos', icon: Receipt },
    { path: '/app/bag', label: 'Maleta', icon: ShoppingBag },
    { path: '/app/favorites', label: 'Favoritos', icon: Heart },
    { path: '/app/guide', label: 'Guía', icon: MapIcon },
    { path: '/app/itineraries', label: 'Mis viajes', icon: Plane },
  ];
  
  const isItineraryPageActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || (location.pathname === '/app' && location.search.includes('itineraryId='));
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-border bg-background/50 px-3 py-4 md:flex">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.path === '/app' 
          ? isItineraryPageActive()
          : location.pathname === item.path;
        
        return (
          <Link key={item.path} to={item.path}>
            <Button 
              variant={isActive ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-3"
              size="sm"
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </aside>
  );
}

export default WebSideMenu;
