import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PandaLogo } from './PandaLogo';
import { NotificationBell } from './NotificationBell';
import { Button } from './ui/button';

interface MobileHeaderProps {
  title?: string;
}

function MobileHeader({ title = 'Routeit' }: MobileHeaderProps) {
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
          <Link to="/app/search">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Search className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <NotificationBell />
          <Link to="/app/profile">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                <span className="text-xs font-semibold text-primary">JO</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
