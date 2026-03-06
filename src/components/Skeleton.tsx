import React from 'react';

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use shimmer animation instead of pulse. Default: pulse */
  variant?: 'pulse' | 'shimmer';
}

/**
 * Loading placeholder with animation. Use for text lines, avatars, cards, etc.
 * Pass className for size/shape (e.g. h-4 w-full rounded, or h-12 w-12 rounded-full).
 */
export function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-md skeleton-bg',
        variant === 'shimmer' ? 'skeleton-shimmer' : 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
