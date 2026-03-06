import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cookie, Shield, BarChart3, Megaphone, Settings2 } from 'lucide-react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import AnimatedLink from './AnimatedLink';
import type { CookieConsentState } from '../contexts/CookieConsentContext';

interface ConsentCategory {
  id: 'essential' | 'analytics' | 'marketing' | 'preferences';
  name: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
}

const categories: ConsentCategory[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'These cookies are required for basic website functionality and cannot be disabled.',
    icon: <Shield size={20} />,
    required: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'These cookies help us understand how visitors interact with the website.',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'These cookies are used to make advertising more relevant to you.',
    icon: <Megaphone size={20} />,
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'These cookies store your settings and preferences.',
    icon: <Settings2 size={20} />,
  },
];

export default function CookieConsent() {
  const {
    consent,
    showBanner,
    showSettings,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  const [localSettings, setLocalSettings] = useState<CookieConsentState>({
    analytics: consent.analytics,
    marketing: consent.marketing,
    preferences: consent.preferences,
  });

  useEffect(() => {
    setLocalSettings({
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences,
    });
  }, [consent]);

  const handleToggle = (category: 'analytics' | 'marketing' | 'preferences') => {
    setLocalSettings((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(localSettings);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && !showSettings && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-4 right-4 z-[10000] w-full max-w-sm"
          >
            <div className="bg-white/95 dark:bg-app-dark/95 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-xl shrink-0">
                  <Cookie className="text-accent" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    Cookie Settings
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                    We use cookies to enhance your experience. You can choose which cookies to allow.{' '}
                    <AnimatedLink href="/privacy-policy" className="inline">
                      Learn more
                    </AnimatedLink>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={rejectAll}
                    className="flex-1 px-4 py-2.5 text-xs font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={openSettings}
                    className="flex-1 px-4 py-2.5 text-xs font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    Customize
                  </button>
                </div>
                <button
                  onClick={acceptAll}
                  className="w-full px-4 py-2.5 text-xs font-medium text-gray-900 bg-accent hover:bg-accent/90 rounded-xl transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSettings}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001]"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-settings-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-[10002] bg-white dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Cookie className="text-accent" size={20} />
                  </div>
                  <h2 id="cookie-settings-title" className="text-lg font-bold text-gray-900 dark:text-white">
                    Cookie Settings
                  </h2>
                </div>
                <button
                  onClick={closeSettings}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-zinc-400"
                  aria-label="Close cookie settings"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 bg-gray-50/50 dark:bg-zinc-900/50 rounded-xl border border-gray-200/50 dark:border-zinc-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-gray-500 dark:text-zinc-400">
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {category.name}
                            {category.required && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-zinc-500 font-normal">
                                (Required)
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={
                            category.required ||
                            !!localSettings[category.id as keyof CookieConsentState]
                          }
                          onChange={() =>
                            !category.required &&
                            handleToggle(category.id as 'analytics' | 'marketing' | 'preferences')
                          }
                          disabled={!!category.required}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors ${
                            category.required
                              ? 'bg-accent/50 cursor-not-allowed'
                              : 'bg-gray-200 dark:bg-zinc-700 peer-checked:bg-accent peer-focus:ring-2 peer-focus:ring-accent/20'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              category.required ||
                              localSettings[category.id as keyof CookieConsentState]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={rejectAll}
                  className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-3 text-sm font-medium text-gray-900 bg-accent hover:bg-accent/90 rounded-xl transition-colors sm:ml-auto"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
