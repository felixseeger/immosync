import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-yellow/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-yellow/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-neon-yellow rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black rotate-45" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-center">SITESYNC</h1>
          </div>
        </div>

        <div className="bg-panel-dark border border-border-dark rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            {isLogin ? 'Enter your credentials to access your portfolio' : 'Join SiteSync to manage your real estate assets'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="technical-label text-zinc-400 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-neon-yellow transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-yellow/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="technical-label text-zinc-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-neon-yellow transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-yellow/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="technical-label text-zinc-400">Password</label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="technical-label text-neon-yellow hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-neon-yellow transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-app-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-yellow/50 transition-all"
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
              className="w-full flex items-center justify-center gap-2 bg-app-dark border border-neon-yellow text-neon-yellow font-bold py-3 rounded-lg hover:bg-neon-yellow/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase tracking-tight">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-dark text-center">
            <p className="text-zinc-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-neon-yellow font-bold hover:underline"
              >
                {isLogin ? 'Register Now' : 'Sign In'}
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
