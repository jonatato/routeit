import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Receipt, Plane, ShoppingBag, Settings, Video, Store, LogOut } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { NotificationBell } from './NotificationBell';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkUserRole } from '../services/itinerary';
import { useUserInitials } from '../hooks/useUserInitials';

function WebSideMenu() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const initials = useUserInitials();
  
  useEffect(() => {
    const checkRole = async () => {
      const itineraryId = searchParams.get('itineraryId');
      if (!itineraryId) {
        setUserRole('owner'); // Si no hay itinerario, asumimos owner
        return;
      }
      
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      
      try {
        const role = await checkUserRole(data.user.id, itineraryId);
        setUserRole(role);
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkRole();
  }, [searchParams]);
  
  const canEdit = userRole !== 'viewer';
  
  const baseMenuItems = [
    { path: '/app', label: 'Inicio', icon: Home },
    { path: '/app/store', label: 'Tienda', icon: Store },
    { path: '/app/split', label: 'Gastos', icon: Receipt },
    { path: '/app/bag', label: 'Maleta', icon: ShoppingBag },
    { path: '/app/memories', label: 'Vídeos', icon: Video },
    { path: '/app/itineraries', label: 'Mis viajes', icon: Plane },
  ];
  
  const adminMenuItem = { path: '/app/admin', label: 'Administrar', icon: Settings };
  
  const menuItems = canEdit 
    ? [baseMenuItems[0], adminMenuItem, ...baseMenuItems.slice(1)]
    : baseMenuItems;
  
  const isItineraryPageActive = () => {
    // Considerar activo si estamos en /app con query params de itineraryId
    return location.pathname === '/app' || (location.pathname === '/app' && location.search.includes('itineraryId='));
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background/85 px-3 py-4 backdrop-blur-sm md:flex">
      {/* Logo */}
      <Link to="/app" className="mb-6 flex items-center gap-2 px-2">
        <PandaLogo
          size="2xl"
          className="[&_img]:rounded-full [&_img]:border [&_img]:border-border [&_img]:bg-card [&_img]:p-1"
        />
        <span className="text-xl font-bold">
          Route<span className="text-primary">it</span>
        </span>
      </Link>

      {/* Notifications and Profile */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <NotificationBell />
        <Link to="/app/profile">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
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
                className="w-full justify-start gap-3 text-foreground hover:!bg-muted hover:!text-foreground dark:hover:!bg-secondary/70"
                size="sm"
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
      </div>

      <div className="mt-4 shrink-0 border-t border-border/70 pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-foreground hover:!bg-muted hover:!text-foreground dark:hover:!bg-secondary/70"
          size="sm"
          onClick={() => void supabase.auth.signOut()}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  );
}

export default WebSideMenu;
