import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { t } from '../i18n/de';
import LiquidGradientBackground from './LiquidGradientBackground';

interface PasswordResetProps {
  onBack: () => void;
}

export default function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t.passwordReset.errorEmailRequired);
      setLoading(false);
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      const res = await fetch(`${origin}/api/send-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const text = await res.text();
      let data: { ok?: boolean; error?: string };
      try {
        data = text ? (JSON.parse(text) as { ok?: boolean; error?: string }) : {};
      } catch {
        setError(res.ok ? t.passwordReset.errorInvalidResponse : t.passwordReset.errorApiUnavailable);
        return;
      }
      if (!res.ok || !data.ok) {
        const msg = typeof data.error === 'string' && data.error.trim() ? data.error.trim() : null;
        if (res.status === 404) {
          setError(t.passwordReset.errorApiNotFound);
        } else {
          setError(msg || t.passwordReset.errorRequestFailed);
        }
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Password reset error:', err);
      setError(
        err instanceof TypeError && err.message?.includes('fetch')
          ? t.passwordReset.errorNetwork
          : t.passwordReset.errorSendFailed
      );
    } finally {
      setLoading(false);
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
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/img/logo-icon.svg" alt="IMMOSYNC" className="w-10 h-10" />
            <img src="/img/logo-type-white.svg" alt="IMMOSYNC" className="h-6" />
          </div>
        </div>

        <div className="bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-2">{t.passwordReset.title}</h2>
          <p className="text-zinc-500 text-sm mb-8">
            {t.passwordReset.subtitle}
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg text-accent">
                <CheckCircle size={24} className="shrink-0" />
                <div className="text-sm space-y-1">
                  <p>
                    {t.passwordReset.successMessage.replace('{email}', email)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white dark:text-black font-bold py-3 rounded-lg hover:bg-accent/90 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={18} />
                <span className="uppercase tracking-tight">{t.passwordReset.backToSignIn}</span>
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="technical-label text-zinc-400 ml-1">{t.passwordReset.emailLabel}</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs"
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white dark:text-black font-bold py-3 rounded-lg hover:bg-accent/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <span className="uppercase tracking-tight">{t.passwordReset.sendLink}</span>
                )}
              </button>
            </form>
          )}

          {!sent && (
            <div className="mt-8 pt-6 border-t border-border-dark text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-zinc-500 text-sm hover:text-accent font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                {t.passwordReset.backToSignIn}
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-mono">
          Secure Access · SiteSync.io
        </p>
      </motion.div>
    </div>
  );
}
