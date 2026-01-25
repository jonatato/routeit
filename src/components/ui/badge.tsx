import * as React from 'react';
import { Badge as FlowbiteBadge } from 'flowbite-react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'accent';

export interface BadgeProps extends React.ComponentProps<typeof FlowbiteBadge> {
  variant?: BadgeVariant;
}

const variantToColor: Record<BadgeVariant, React.ComponentProps<typeof FlowbiteBadge>['color']> = {
  default: 'gray',
  primary: 'blue',
  secondary: 'cyan',
  accent: 'green',
};

const Badge = ({ variant = 'default', ...props }: BadgeProps) => {
  return <FlowbiteBadge color={variantToColor[variant]} {...props} />;
};

export { Badge };
