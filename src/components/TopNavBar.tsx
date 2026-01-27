import { Link } from 'react-router-dom';
import { Search, Bell, Heart, MessageSquare, Receipt, Map, Plane } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationBell } from './NotificationBell';

function TopNavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/app" className="flex items-center gap-2">
          <PandaLogo size="sm" />
          <span className="text-xl font-bold">Routeit</span>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/app">
            <Button variant="ghost" size="sm" className="gap-2">
              <Map className="h-4 w-4 text-primary" />
              Inicio
            </Button>
          </Link>
          <Link to="/app/chat">
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Link to="/app/split">
            <Button variant="ghost" size="sm" className="gap-2">
              <Receipt className="h-4 w-4" />
              Gastos
            </Button>
          </Link>
          <Link to="/app/favorites">
            <Button variant="ghost" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              Favoritos
            </Button>
          </Link>
          <Link to="/app/guide">
            <Button variant="ghost" size="sm" className="gap-2">
              <Map className="h-4 w-4" />
              Guía
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
          <Link to="/app/search">
            <Button variant="ghost" size="icon" className="relative">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <NotificationBell />
          <Link to="/app/profile">
            <Button variant="ghost" size="icon" className="relative">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">JO</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;
