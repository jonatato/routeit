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
  default: 'blue',
  secondary: 'light',
  outline: 'gray',
  ghost: 'gray',
  destructive: 'failure',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', outline, ...props }, ref) => {
    const color = variantToColor[variant];
    const isOutline = variant === 'outline' || variant === 'ghost' ? true : outline;
    const ghostClasses = variant === 'ghost' ? 'border-0 bg-transparent' : '';
    return (
      <FlowbiteButton
        ref={ref}
        color={color}
        size={size}
        outline={isOutline}
        className={cn(ghostClasses, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
