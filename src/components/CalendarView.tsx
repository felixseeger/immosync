import React from 'react';
import { Plus, Calendar } from 'lucide-react';

export default function CalendarView() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white/90 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Calendar
        </h2>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-neon-green text-black font-bold rounded-lg text-sm hover:bg-white hover:text-black transition-colors"
        >
          <Plus size={18} />
          New event
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-zinc-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-500 dark:text-zinc-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Calendar</h3>
          <p className="text-sm">This module is currently under development.</p>
        </div>
      </div>
    </div>
  );
}
