import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { t } from '../i18n/de';
import LiquidGradientBackground from './LiquidGradientBackground';

interface AuthProps {
  onSuccess: () => void;
  onForgotPassword?: () => void;
}

export default function Auth({ onSuccess, onForgotPassword }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // Send welcome email (best-effort; do not block or fail signup)
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const firstName = name.split(/\s+/)[0] || name || 'Nutzer';
        fetch(`${base}/api/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            firstName: firstName.trim(),
            loginLink: base,
            bookingLink: base,
          }),
        }).catch(() => { /* ignore */ });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.auth.authError);
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
          <h2 className="text-2xl font-bold mb-2">
            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            {isLogin ? t.auth.loginSubtitle : t.auth.signupSubtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="technical-label text-zinc-400 ml-1">{t.auth.fullName}</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} aria-hidden="true" />
                  <input
                    id="auth-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.auth.fullNamePlaceholder}
                    className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="technical-label text-zinc-400 ml-1">{t.auth.emailAddress}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} aria-hidden="true" />
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="auth-password" className="technical-label text-zinc-400">{t.auth.password}</label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="technical-label text-accent hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} aria-hidden="true" />
                <input
                  id="auth-password"
                  type="password"
                  name="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  spellCheck={false}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                role="alert"
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs"
              >
                <AlertCircle size={14} aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-app-dark border border-accent text-accent font-bold py-3 rounded-lg hover:bg-accent/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                  <span>{t.auth.loading}</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-tight">{isLogin ? t.auth.signIn : t.auth.createAccountButton}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-dark text-center">
            <p className="text-zinc-500 text-sm">
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-accent font-bold hover:underline"
              >
                {isLogin ? t.auth.registerNow : t.auth.signIn}
              </button>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-mono">
          Secure Access • SiteSync.io • v1.0.4
        </p>
      </motion.div>
    </div>
  );
}
