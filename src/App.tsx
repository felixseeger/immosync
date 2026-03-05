import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Search, 
  Bell, 
  Sun, 
  Moon,
  Plus,
  Filter,
  Grid,
  List,
  Map as MapIcon,
  Maximize2,
  ChevronRight,
  Settings,
  LogOut,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 group ${active ? 'text-neon-yellow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white'}`}
  >
    <div className={`relative ${active ? 'text-neon-yellow' : ''}`}>
      <Icon size={20} />
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="absolute -left-4 top-0 bottom-0 w-1 bg-neon-yellow rounded-r-full"
        />
      )}
    </div>
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme-mode');
    return stored ? stored === 'dark' : true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize dark class on mount
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  useEffect(() => {
    // Update dark class and localStorage when mode changes
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-neon-yellow rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-black rotate-45" />
          </div>
          <p className="text-gray-500 dark:text-zinc-500 technical-label animate-pulse">Initializing SiteSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden font-sans text-gray-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-border-dark flex flex-col bg-gray-50 dark:bg-black z-20">
        <div className="p-6 flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="#D9FF00"/>
            <polyline points="6,22 12,12 18,19 22,14 26,14" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="26" cy="14" r="2.5" fill="black"/>
          </svg>
          <h1 className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white">SITESYNC<span className="text-neon-yellow">.IO</span></h1>
        </div>

        <nav className="flex-1 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <SidebarItem icon={Building2} label="Properties" active={activeTab === 'Properties'} onClick={() => setActiveTab('Properties')} />
          <SidebarItem icon={Users} label="Contacts" active={activeTab === 'Contacts'} onClick={() => setActiveTab('Contacts')} />
          <SidebarItem icon={Briefcase} label="Deals" active={activeTab === 'Deals'} onClick={() => setActiveTab('Deals')} />
          <SidebarItem icon={Calendar} label="Calendar" active={activeTab === 'Calendar'} onClick={() => setActiveTab('Calendar')} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'Messages'} onClick={() => setActiveTab('Messages')} />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-border-dark space-y-2">
          {/* Theme toggle */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-gray-600 dark:text-zinc-600 uppercase tracking-wider font-medium">Theme</span>
            <button
              onClick={() => setIsDarkMode(d => !d)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          {/* User badge with logout popover */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(m => !m)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors w-full text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-800 border border-gray-300 dark:border-border-dark overflow-hidden shrink-0">
                <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user.displayName || 'User'}</p>
                <p className="text-xs text-gray-600 dark:text-zinc-500 truncate">{user.email}</p>
              </div>
              <ChevronUp size={14} className={`text-gray-600 dark:text-zinc-500 transition-transform shrink-0 ${showUserMenu ? '' : 'rotate-180'}`} />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-white dark:bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-gray-100 dark:from-zinc-900/20 via-white dark:via-black to-white dark:to-black pointer-events-none" />
        
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Properties' && <Properties />}
        
        {activeTab !== 'Dashboard' && activeTab !== 'Properties' && (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-zinc-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="animate-spin-slow" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{activeTab} Module</h3>
              <p className="text-sm">This module is currently under development.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
