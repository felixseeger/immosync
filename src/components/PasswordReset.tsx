import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to send reset email. Check the address and try again.';
      setError(message);
    } finally {
      setLoading(false);
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
        className="w-full max-w-md relative"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black rotate-45" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">SITESYNC<span className="text-accent">.IO</span></h1>
          </div>
        </div>

        <div className="bg-panel-dark border border-border-dark rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2">Reset password</h2>
          <p className="text-zinc-500 text-sm mb-8">
            Enter your account email and we’ll send a link to set a new password.
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg text-accent">
                <CheckCircle size={24} className="shrink-0" />
                <p className="text-sm">
                  If an account exists for <strong className="text-white">{email}</strong>, you’ll receive a password reset link. Check your inbox and spam folder.
                </p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white dark:text-black font-bold py-3 rounded-lg hover:bg-accent/90 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={18} />
                <span className="uppercase tracking-tight">Back to sign in</span>
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="technical-label text-zinc-400 ml-1">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
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
                  <span className="uppercase tracking-tight">Send reset link</span>
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
                Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-mono">
          Secure Access • SiteSync.io
        </p>
      </motion.div>
    </div>
  );
}
