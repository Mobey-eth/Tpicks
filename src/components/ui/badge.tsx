import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label uppercase tracking-wider font-medium transition-colors duration-300',
  {
    variants: {
      variant: {
        default: 'bg-canvas-alt text-ink-muted',
        live: 'bg-status-live-bg text-status-live',
        closed: 'bg-status-closed-bg text-status-closed',
        upcoming: 'bg-status-upcoming-bg text-status-upcoming',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-live opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-live" />
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
