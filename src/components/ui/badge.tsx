import * as React from 'react';
import { Badge as FlowbiteBadge } from 'flowbite-react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'outline';

export interface BadgeProps extends React.ComponentProps<typeof FlowbiteBadge> {
  variant?: BadgeVariant;
}

const variantToColor: Record<BadgeVariant, React.ComponentProps<typeof FlowbiteBadge>['color']> = {
  default: 'gray',
  primary: 'blue',
  secondary: 'cyan',
  accent: 'green',
  outline: 'gray',
};

const Badge = ({ variant = 'default', ...props }: BadgeProps) => {
  const isOutline = variant === 'outline';
  const { className, ...restProps } = props;
  return (
    <FlowbiteBadge 
      color={variantToColor[variant]} 
      {...(isOutline ? { className: `border ${className ?? ''}` } : {})}
      {...restProps}
    />
  );
};

export { Badge };
