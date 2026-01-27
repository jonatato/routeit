import { cn } from '../lib/utils';
import pandaLogoSvg from '../assets/panda-logo.svg';

type PandaLogoProps = {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-24 w-24',
};

export function PandaLogo({ className, showText = false, size = 'md' }: PandaLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={pandaLogoSvg}
        alt="Routeit Logo"
        className={cn(sizeClasses[size])}
      />
      {showText && (
        <span className="text-lg font-bold">
          Route<span className="text-red-500">i</span>t
        </span>
      )}
    </div>
  );
}
