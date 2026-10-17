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
  destructive: 'purple',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', outline, ...props }, ref) => {
    const color: React.ComponentProps<typeof FlowbiteButton>['color'] = (variantToColor[variant as ButtonVariant] ?? 'purple') as React.ComponentProps<typeof FlowbiteButton>['color'];
    const isOutline = variant === 'outline' || variant === 'ghost' ? true : outline;
    const variantClasses: Record<ButtonVariant, string> = {
      default:
        '!bg-primary !text-primaryForeground border-transparent hover:!bg-primary/90 dark:!bg-primary dark:!text-primaryForeground dark:hover:!bg-primary/85 dark:shadow-[0_10px_26px_hsl(var(--primary)/0.45)]',
      secondary:
        '!bg-secondary !text-foreground border-transparent hover:!bg-secondary/85 dark:!border-border/80 dark:!bg-card dark:!text-foreground dark:hover:!bg-card/85 dark:shadow-sm',
      outline:
        '!border-border bg-transparent text-foreground hover:!bg-muted hover:!text-foreground dark:!border-primary/55 dark:!bg-secondary/70 dark:!text-foreground dark:hover:!bg-secondary/90 dark:shadow-sm',
      ghost:
        '!border !border-transparent bg-transparent shadow-none text-foreground hover:!bg-muted hover:!text-foreground dark:!border-border/80 dark:!bg-secondary/60 dark:!text-foreground dark:hover:!bg-secondary/85 dark:hover:!border-primary/45 dark:shadow-sm',
      destructive:
        '!border !border-primary/35 !bg-secondary/75 !text-foreground hover:!bg-secondary dark:!border-primary/45 dark:!bg-secondary/80 dark:!text-foreground dark:hover:!bg-secondary/95',
    };
    const baseClasses = 'rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:-translate-y-0.5 active:translate-y-0';
    const shadowClasses = variant === 'default' ? 'shadow-[0_10px_24px_rgba(111,99,216,0.25)] dark:shadow-[0_10px_28px_hsl(var(--primary)/0.45)]' : 'shadow-none';
    return (
      <FlowbiteButton
        ref={ref}
        color={color}
        size={size}
        outline={isOutline}
        className={cn(baseClasses, shadowClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
