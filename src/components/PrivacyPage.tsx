import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LiquidGradientBackground from './LiquidGradientBackground';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-app-light dark:bg-app-dark">
      <LiquidGradientBackground variant="dark" className="absolute inset-0 z-0 pointer-events-none opacity-50" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-accent hover:underline mb-8">
          <ArrowLeft size={16} />
          Back to app
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-gray-600 dark:text-zinc-400 space-y-4">
          <p>Last updated: 2026.</p>
          <p>This policy describes how ImmoSync collects, uses, and protects your data. Add your full privacy policy content here.</p>
        </div>
      </div>
    </div>
  );
}
