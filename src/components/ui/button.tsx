import * as React from 'react';
import { Button as FlowbiteButton } from 'flowbite-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ComponentProps<typeof FlowbiteButton> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantToColor: Record<ButtonVariant, React.ComponentProps<typeof FlowbiteButton>['color']> = {
  default: 'purple',
  secondary: 'light',
  outline: 'gray',
  ghost: 'gray',
  destructive: 'failure',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', outline, ...props }, ref) => {
    const color: React.ComponentProps<typeof FlowbiteButton>['color'] = (variantToColor[variant as ButtonVariant] ?? 'purple') as React.ComponentProps<typeof FlowbiteButton>['color'];
    const isOutline = variant === 'outline' || variant === 'ghost' ? true : outline;
    const ghostClasses =
      variant === 'ghost'
        ? 'border-0 bg-transparent shadow-none text-foreground hover:!bg-muted hover:!text-foreground dark:hover:!bg-secondary/70'
        : '';
    const outlineClasses =
      variant === 'outline'
        ? '!border-border bg-transparent text-foreground hover:!bg-muted hover:!text-foreground dark:hover:!bg-secondary/70'
        : '';
    const baseClasses = 'rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:-translate-y-0.5 active:translate-y-0';
    const shadowClasses = variant === 'default' ? 'shadow-[0_10px_24px_rgba(111,99,216,0.25)]' : 'shadow-none';
    return (
      <FlowbiteButton
        ref={ref}
        color={color}
        size={size}
        outline={isOutline}
        className={cn(baseClasses, shadowClasses, ghostClasses, outlineClasses, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
