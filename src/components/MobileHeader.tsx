import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Receipt, ShoppingBag, Plane, Video, Store, User, LogOut, Settings } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { checkUserRole } from '../services/itinerary';
import { useUserInitials } from '../hooks/useUserInitials';
import { openCookiePreferences } from '../hooks/useCookieConsent';

interface MobileHeaderProps {
  title?: string;
}

function MobileHeader({ title }: MobileHeaderProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initials = useUserInitials();
  const isAdminActive = location.pathname.startsWith('/app/admin');
  const isProfileActive = location.pathname === '/app/profile';

  // Detectar la sección actual
  const sectionNames: Record<string, string> = {
    '/app': 'Inicio',
    '/app/store': 'Tienda',
    '/app/split': 'Gastos',
    '/app/bag': 'Maleta',
    '/app/memories': 'Vídeos',
    '/app/itineraries': 'Mis viajes',
    '/app/admin': 'Administrar',
    '/app/profile': 'Mi perfil',
  };

  const getSectionTitle = () => {
    if (title) return title;
    const path = location.pathname;
    // Buscar coincidencia exacta primero
    if (sectionNames[path]) return sectionNames[path];
    // Si estamos en una subruta, usar la ruta principal
    for (const [key, value] of Object.entries(sectionNames)) {
      if (path.startsWith(key)) return value;
    }
    return 'RouteIt';
  };

  const currentTitle = getSectionTitle();
  const otaTestLabel = 'Angel te quiero <3';
  
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

  const menuItems = [
    { path: '/app', label: 'Inicio', icon: Home },
    { path: '/app/store', label: 'Tienda', icon: Store },
    { path: '/app/split', label: 'Gastos', icon: Receipt },
    { path: '/app/bag', label: 'Maleta', icon: ShoppingBag },
    { path: '/app/memories', label: 'Vídeos', icon: Video },
    { path: '/app/itineraries', label: 'Mis viajes', icon: Plane },
  ];

  const shouldRenderMenu = isMenuOpen && typeof document !== 'undefined';

  return (
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/95 px-4 py-3 pt-safe-top backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between">
        {/* Actions left */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link to="/app/admin">
              <button className={`relative h-9 w-9 rounded-md flex items-center justify-center transition-colors ${isAdminActive ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                <Settings className={`h-5 w-5 ${isAdminActive ? 'text-primary' : 'text-mutedForeground'}`} />
              </button>
            </Link>
          )}
        </div>

        {/* Título centrado */}
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{otaTestLabel}</p>
          <h1 className="text-xl font-bold text-foreground">
            {currentTitle}
          </h1>
        </div>

        {/* Actions right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className={`relative h-9 w-9 rounded-md flex items-center justify-center transition-colors ${isProfileActive ? 'bg-primary/10' : 'hover:bg-muted'}`}
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
          >
            <div className={`h-8 w-8 rounded-full ${isProfileActive ? 'bg-primary' : 'bg-primary/10'} flex items-center justify-center overflow-hidden transition-colors`}>
              <span className={`text-xs font-semibold ${isProfileActive ? 'text-white' : 'text-primary'}`}>{initials}</span>
            </div>
          </button>
        </div>
      </div>

      {shouldRenderMenu &&
        createPortal(
          <div className="fixed inset-0 z-[9999] isolate">
            <button
              type="button"
              className="fixed inset-0 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar menu"
            />
            <aside className="fixed left-0 top-0 flex h-full w-72 flex-col bg-card pl-safe pt-safe-top shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Menu</p>
                    <p className="text-xs text-mutedForeground">Navegacion rapida</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center"
                    aria-label="Cerrar menu"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="flex flex-col gap-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  {canEdit && (
                    <Link
                      to="/app/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isAdminActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      Administrar
                    </Link>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-mutedForeground">
                    Legal
                  </p>
                  <div className="flex flex-col gap-1">
                    <Link
                      to="/legal/terms"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      Términos de uso
                    </Link>
                    <Link
                      to="/legal/privacy"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      Política de privacidad
                    </Link>
                    <Link
                      to="/legal/cookies"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      Política de cookies
                    </Link>
                    <Link
                      to="/legal/imprint"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      Aviso legal
                    </Link>
                    <Link
                      to="/legal/contact"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      Contacto legal
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        openCookiePreferences();
                      }}
                      className="rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-muted"
                    >
                      Preferencias de cookies
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <Link
                    to="/app/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isProfileActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void supabase.auth.signOut();
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
}

export default MobileHeader;
