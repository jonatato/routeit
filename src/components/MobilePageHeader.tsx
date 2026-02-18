import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

type MobilePageHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
};

export function MobilePageHeader({
  title,
  subtitle,
  backTo = '/app',
  actions,
}: MobilePageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden">
      <div className="flex items-center gap-3">
        <Link to={backTo}>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/70 bg-background/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-mutedForeground">{subtitle}</p>}
        </div>
      </div>
      {actions ? <div className="mt-3 grid grid-cols-2 gap-2">{actions}</div> : null}
    </div>
  );
}
