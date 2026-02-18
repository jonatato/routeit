import * as React from 'react';
import { Card as FlowbiteCard } from 'flowbite-react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof FlowbiteCard>>(
  ({ className, ...props }, ref) => (
    <FlowbiteCard
      ref={ref}
      className={cn(
        '!p-0 rounded-2xl !border !border-border !bg-card dark:!border-border dark:!bg-card shadow-[0_12px_30px_rgba(111,99,216,0.12)] transition-shadow hover:shadow-[0_18px_38px_rgba(111,99,216,0.18)] dark:shadow-[0_18px_38px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_22px_44px_rgba(0,0,0,0.45)]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 p-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-snug tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-mutedForeground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-4 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
