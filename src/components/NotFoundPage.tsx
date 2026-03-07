import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import MandalaBackground from './MandalaBackground';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-app-light dark:bg-app-dark">
      <MandalaBackground />
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center mb-6">
          <AlertCircle className="text-accent" size={40} />
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white tracking-tighter mb-2">404</h1>
        <p className="text-lg text-gray-600 dark:text-zinc-400 mb-6 max-w-md">
          This page doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-gray-900 dark:text-black font-semibold hover:opacity-90 transition-opacity border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <Home size={20} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
