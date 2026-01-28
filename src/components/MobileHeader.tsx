import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { NotificationBell } from './NotificationBell';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkUserRole } from '../services/itinerary';
import { useUserInitials } from '../hooks/useUserInitials';

interface MobileHeaderProps {
  title?: string;
}

function MobileHeader({ title = 'Routeit' }: MobileHeaderProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const initials = useUserInitials();
  const isAdminActive = location.pathname.startsWith('/app/admin');
  const isProfileActive = location.pathname === '/app/profile';
  
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
    <header className="sticky top-0 z-50 border-b border-border/20 bg-white/95 backdrop-blur-md px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/app" className="flex items-center gap-2">
          <PandaLogo size="sm" />
          <span className="text-xl font-bold text-foreground">
            {title === 'Routeit' ? (
              <>
                Route<span className="text-primary">it</span>
              </>
            ) : (
              title
            )}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link to="/app/admin">
              <button className={`relative h-9 w-9 rounded-md flex items-center justify-center transition-colors ${isAdminActive ? 'bg-primary/10' : 'hover:bg-gray-100'}`}>
                <Settings className={`h-5 w-5 ${isAdminActive ? 'text-primary' : 'text-gray-600'}`} />
              </button>
            </Link>
          )}
          <NotificationBell />
          <Link to="/app/profile">
            <button className={`relative h-9 w-9 rounded-md flex items-center justify-center transition-colors ${isProfileActive ? 'bg-primary/10' : 'hover:bg-gray-100'}`}>
              <div className={`h-8 w-8 rounded-full ${isProfileActive ? 'bg-primary' : 'bg-primary/10'} flex items-center justify-center overflow-hidden transition-colors`}>
                <span className={`text-xs font-semibold ${isProfileActive ? 'text-white' : 'text-primary'}`}>{initials}</span>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
