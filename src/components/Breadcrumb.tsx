import React from 'react';
import { ChevronRight } from 'lucide-react';
import AnimatedLink from './AnimatedLink';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Optional class for the nav element */
  className?: string;
  /** Separator between items; default is ChevronRight icon */
  separator?: React.ReactNode;
  /** When provided, non-last items use this instead of href (e.g. switch tab by name/path) */
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
}

export default function Breadcrumb({ items, className = '', separator, onItemClick }: BreadcrumbProps) {
  if (!items.length) return null;

  const defaultSeparator = <ChevronRight className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const sep = separator ?? defaultSeparator;

          return (
            <li key={item.path + index} className="flex items-center gap-x-1">
              {index > 0 && <span className="flex shrink-0">{sep}</span>}
              {isLast ? (
                <span aria-current="page" className="font-medium text-zinc-900 dark:text-white">
                  {item.name}
                </span>
              ) : onItemClick ? (
                <AnimatedLink
                  active={false}
                  onClick={() => onItemClick(item, index)}
                  className="hover:text-accent"
                >
                  {item.name}
                </AnimatedLink>
              ) : (
                <AnimatedLink active={false} href={item.path} className="hover:text-accent">
                  {item.name}
                </AnimatedLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
