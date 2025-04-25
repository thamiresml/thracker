'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full text-xs font-medium ring-1 ring-inset ${
          variant === 'default' 
            ? 'bg-purple-50 text-purple-700 ring-purple-600/20' 
            : variant === 'secondary'
            ? 'bg-purple-100 text-purple-700 ring-purple-500/10'
            : variant === 'outline'
            ? 'bg-transparent text-gray-600 ring-gray-300'
            : 'bg-red-50 text-red-700 ring-red-600/10'
        } ${className}`}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge }; 