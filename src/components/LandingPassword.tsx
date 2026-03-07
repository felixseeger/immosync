import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

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
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black rotate-45" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">
              SITESYNC<span className="text-accent">.IO</span>
            </h1>
          </div>
        </div>

        <div className="bg-app-light dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-6">
            <Lock className="text-accent" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Enter access code</h2>
          <p className="text-zinc-500 text-sm text-center mb-6">
            Enter the password to continue to sign in or sign up.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="gate-password" className="technical-label text-zinc-400 ml-1 sr-only">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} />
                <input
                  id="gate-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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
              Continue
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
