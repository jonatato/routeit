import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Receipt, Heart, Map as MapIcon, Plane, ShoppingBag, Settings, Search } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { NotificationBell } from './NotificationBell';

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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background/50 px-3 py-4 md:flex">
      {/* Logo */}
      <Link to="/app" className="flex items-center gap-2 mb-6 px-2">
        <PandaLogo size="sm" />
        <span className="text-xl font-bold">
          Route<span className="text-primary">it</span>
        </span>
      </Link>

      {/* Search, Notifications, Profile */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <Link to="/app/search" className="flex-1">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Search className="h-4 w-4" />
            <span className="text-muted-foreground">Buscar...</span>
          </Button>
        </Link>
        <NotificationBell />
        <Link to="/app/profile">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">JO</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-1">
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
      </div>
    </aside>
  );
}

export default WebSideMenu;
