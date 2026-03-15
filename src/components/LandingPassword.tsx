import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../i18n/de';
import LiquidGradientBackground from './LiquidGradientBackground';

const GATE_PASSWORD = 'sitesync123';
const STORAGE_KEY = 'sitesync-gate-unlocked';

export function isGateUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setGateUnlocked(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

interface LandingPasswordProps {
  onUnlock: () => void;
}

export default function LandingPassword({ onUnlock }: LandingPasswordProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.trim() === GATE_PASSWORD) {
      setGateUnlocked();
      onUnlock();
    } else {
      setError(t.landing.incorrectPassword);
    }
  };

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6 relative overflow-hidden">
      <LiquidGradientBackground
        variant="dark"
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <img src="/img/logo-icon.svg" alt="IMMOSYNC" className="w-10 h-10" />
            <img src="/img/logo-type-white.svg" alt="IMMOSYNC" className="h-6" />
          </div>
        </div>
        <div className="bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-6 mx-auto">
            <Lock className="text-accent" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">{t.landing.title}</h2>
          <p className="text-zinc-500 text-sm text-center mb-6">
            {t.landing.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="gate-password" className="technical-label text-zinc-400 ml-1 sr-only">
                {t.landing.passwordLabel}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} />
                <input
                  id="gate-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.landing.passwordPlaceholder}
                  autoComplete="off"
                  className="w-full bg-app-dark border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-zinc-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-accent text-white dark:text-black font-bold py-3 rounded-lg hover:bg-accent/90 transition-colors active:scale-[0.98]"
            >
              {t.landing.continueButton}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
