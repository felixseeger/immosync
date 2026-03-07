import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-app-light/80 dark:bg-app-dark/80 backdrop-blur-md">
      <div className="w-full flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-zinc-400 px-4 py-3 pr-6">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Footer navigation">
          <Link to="/imprint" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Imprint
          </Link>
          <span className="text-gray-400 dark:text-zinc-500 select-none" aria-hidden>·</span>
          <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Privacy
          </Link>
          <span className="text-gray-400 dark:text-zinc-500 select-none" aria-hidden>·</span>
          <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Terms
          </Link>
        </nav>
        <span className="text-gray-400 dark:text-zinc-500 select-none" aria-hidden>·</span>
        <p className="text-sm">© 2026 Felix Seeger</p>
      </div>
    </footer>
  );
}
