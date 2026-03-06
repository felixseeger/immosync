import React from 'react';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../contexts/CookieConsentContext';

export interface CookieSettingsButtonProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export default function CookieSettingsButton({ variant = 'floating', className = '' }: CookieSettingsButtonProps) {
  const { openSettings, hasConsented } = useCookieConsent();

  if (!hasConsented) return null;

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={openSettings}
        className={`text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-2 ${className}`}
        aria-label="Open cookie settings"
      >
        <Cookie size={14} />
        Cookie Settings
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSettings}
      className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[9998] w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/90 dark:bg-app-dark/90 backdrop-blur-md border border-gray-200 dark:border-zinc-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all hover:scale-110 ${className}`}
      aria-label="Open cookie settings"
      title="Cookie Settings"
    >
      <Cookie className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600 dark:text-zinc-400" />
    </button>
  );
}
