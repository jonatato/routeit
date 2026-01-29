import { Link, useSearchParams } from 'react-router-dom';
import { Receipt, ShoppingBag, Plane, Settings } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';
import { useUserInitials } from '../hooks/useUserInitials';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkUserRole } from '../services/itinerary';

function TopNavBar() {
  const initials = useUserInitials();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  
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
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/app" className="flex items-center gap-2">
          <PandaLogo size="sm" />
          <span className="text-xl font-bold">
            Route<span className="text-primary">it</span>
          </span>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/app">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Inicio
            </Button>
          </Link>
          {canEdit && (
          <Link to="/app/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Administrar
            </Button>
          </Link>
          )}
          <Link to="/app/split">
            <Button variant="ghost" size="sm" className="gap-2">
              <Receipt className="h-4 w-4" />
              Gastos
            </Button>
          </Link>
          <Link to="/app/bag">
            <Button variant="ghost" size="sm" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Maleta
            </Button>
          </Link>
          <Link to="/app/itineraries">
            <Button variant="ghost" size="sm" className="gap-2">
              <Plane className="h-4 w-4" />
              Mis viajes
            </Button>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link to="/app/profile">
            <Button variant="ghost" size="icon" className="relative">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{initials}</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;
