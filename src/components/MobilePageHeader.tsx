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
    <div className="sticky top-0 z-30 border-b border-border/80 bg-card/95 px-4 pb-3 pt-[calc(var(--safe-area-inset-top)+0.75rem)] backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden">
      <div className="flex min-h-9 items-center gap-3">
        <Link to={backTo}>
          <Button variant="ghost" size="icon" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1 self-center">
          <h1 className="truncate text-base font-semibold leading-none text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-mutedForeground">{subtitle}</p>}
        </div>
      </div>
      {actions ? <div className="mt-3 grid grid-cols-2 gap-2">{actions}</div> : null}
    </div>
  );
}
