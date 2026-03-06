import React from 'react';

const activeClasses =
  'text-accent hover:underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded px-0.5';

const inactiveClasses =
  'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded px-0.5';

export interface AnimatedLinkProps {
  children: React.ReactNode;
  /** Optional href: renders as <a>. Omit for in-app actions (renders as button). */
  href?: string;
  /** Optional click handler. Use for in-app navigation (e.g. select property/contact). */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  /** Optional. External links open in new tab and get rel="noopener noreferrer". */
  external?: boolean;
  /** When false, use inactive style (e.g. sidebar nav item). Default true = yellow link style. */
  active?: boolean;
  className?: string;
  title?: string;
  /** Accessible label when content is not descriptive enough */
  'aria-label'?: string;
}

/**
 * Styled text link: accent (purple in light, yellow in dark), hover underline, focus ring.
 * Use with href for real links, or onClick for in-app actions (tab switch, select entity).
 */
export default function AnimatedLink({
  children,
  href,
  onClick,
  external = false,
  active = true,
  className = '',
  title,
  'aria-label': ariaLabel,
}: AnimatedLinkProps) {
  const base = active ? activeClasses : inactiveClasses;
  const combinedClassName = [base, className].filter(Boolean).join(' ');

  if (href != null) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        className={combinedClassName}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={combinedClassName}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
