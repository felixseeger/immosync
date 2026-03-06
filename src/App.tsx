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
  ChevronLeft,
  Settings,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import PasswordReset from './components/PasswordReset';
import LandingPassword, { isGateUnlocked } from './components/LandingPassword';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Contacts from './components/Contacts';
import Deals from './components/Deals';
import CalendarView from './components/CalendarView';
import MessagesView from './components/MessagesView';
import GlobalSearchBar from './components/GlobalSearchBar';
import UserSettings from './components/UserSettings';
import { upsertUserProfile } from './services/usersService';

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: { icon: React.ComponentType<{ size?: number }>, label: string, active?: boolean, onClick: () => void; collapsed?: boolean }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 py-3 cursor-pointer transition-all duration-200 group ${collapsed ? 'px-0 justify-center md:justify-center' : 'px-4'} ${active ? 'text-neon-yellow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white'}`}
    title={collapsed ? label : undefined}
  >
    <div className={`relative shrink-0 ${active ? 'text-neon-yellow' : ''}`}>
      <Icon size={20} />
      {active && !collapsed && (
        <motion.div 
          layoutId="active-nav"
          className="absolute -left-4 top-0 bottom-0 w-1 bg-neon-yellow rounded-r-full"
        />
      )}
    </div>
    {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showPropertiesAddPanel, setShowPropertiesAddPanel] = useState(false);
  const [initialSelectedPropertyId, setInitialSelectedPropertyId] = useState<string | null>(null);
  const [initialSelectedContactId, setInitialSelectedContactId] = useState<string | null>(null);
  const [initialSelectedDealId, setInitialSelectedDealId] = useState<string | null>(null);
  const [initialSelectedViewingId, setInitialSelectedViewingId] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme-mode');
    return stored ? stored === 'dark' : true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(() => isGateUnlocked());
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        upsertUserProfile(currentUser).catch((error) => {
          console.error('Failed to upsert user profile', error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize dark class on mount based on localStorage
    const isDark = localStorage.getItem('theme-mode') ? localStorage.getItem('theme-mode') === 'dark' : true;
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    // Update dark class and localStorage when mode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
    console.log('Theme toggled:', isDarkMode ? 'DARK' : 'LIGHT', 'html.classList:', Array.from(document.documentElement.classList));
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
    if (!gateUnlocked) {
      return <LandingPassword onUnlock={() => setGateUnlocked(true)} />;
    }
    if (showPasswordReset) {
      return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
    }
    return (
      <Auth
        onSuccess={() => {}}
        onForgotPassword={() => setShowPasswordReset(true)}
      />
    );
  }

  const closeSidebar = () => setSidebarOpen(false);
  const goTo = (tab: string) => {
    setActiveTab(tab);
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden font-sans text-gray-900 dark:text-zinc-100">
      {/* Mobile overlay when sidebar open */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={closeSidebar}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Sidebar: drawer on mobile (<768px), foldable on desktop */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-border-dark ease-out
          w-64 md:transition-[width] md:duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:w-[72px]' : 'md:w-64'}
          transition-transform duration-200 md:transform-none
        `}
      >
        <div className={`relative flex items-center gap-2 shrink-0 border-b border-gray-200 dark:border-border-dark ${sidebarCollapsed ? 'p-3 md:justify-center md:flex-col' : 'p-6 md:px-4'} transition-all duration-200 min-h-[72px]`}>
          {!sidebarCollapsed && (
            <>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect width="32" height="32" rx="8" fill="#D9FF00"/>
                <polyline points="6,22 12,12 18,19 22,14 26,14" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="26" cy="14" r="2.5" fill="black"/>
              </svg>
              <h1 className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white truncate">SITESYNC</h1>
            </>
          )}
          {/* Mobile: close button */}
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden ml-auto p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          {/* Desktop: collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(c => !c)}
            className={`hidden md:flex p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 ${sidebarCollapsed ? '' : 'ml-auto'}`}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={20} className={sidebarCollapsed ? 'rotate-180' : ''} />
          </button>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => goTo('Dashboard')} collapsed={sidebarCollapsed} />
          <SidebarItem icon={Building2} label="Properties" active={activeTab === 'Properties'} onClick={() => goTo('Properties')} collapsed={sidebarCollapsed} />
          <SidebarItem icon={Users} label="Contacts" active={activeTab === 'Contacts'} onClick={() => goTo('Contacts')} collapsed={sidebarCollapsed} />
          <SidebarItem icon={Briefcase} label="Deals" active={activeTab === 'Deals'} onClick={() => goTo('Deals')} collapsed={sidebarCollapsed} />
          <SidebarItem icon={Calendar} label="Calendar" active={activeTab === 'Calendar'} onClick={() => goTo('Calendar')} collapsed={sidebarCollapsed} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'Messages'} onClick={() => goTo('Messages')} collapsed={sidebarCollapsed} />
        </nav>

        <div className={`p-4 border-t border-gray-200 dark:border-border-dark space-y-2 ${sidebarCollapsed ? 'md:px-2' : ''}`}>
          {/* Theme toggle - hide labels when collapsed */}
          <div className={`flex items-center justify-between px-2 py-1 ${sidebarCollapsed ? 'md:justify-center md:flex-col md:gap-1' : ''}`}>
            {!sidebarCollapsed && <span className="text-xs text-gray-600 dark:text-zinc-600 uppercase tracking-wider font-medium">Theme</span>}
            <div className="flex items-center gap-2">
              {!sidebarCollapsed && (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">
                  {isDarkMode ? 'DARK' : 'LIGHT'}
                </span>
              )}
              <button
                onClick={() => setIsDarkMode(d => !d)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
          {/* User badge */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(false); setShowUserSettings(true); }}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors w-full text-left ${sidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-800 border border-gray-300 dark:border-border-dark overflow-hidden shrink-0">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'U')}`} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user.displayName || 'User'}</p>
                  <p className="text-xs text-gray-600 dark:text-zinc-500 truncate">{user.email}</p>
                </div>
              )}
              {!sidebarCollapsed && <ChevronUp size={14} className="text-gray-600 dark:text-zinc-500 shrink-0 rotate-180" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-white dark:bg-black flex flex-col">
        {/* Background gradient behind content so map/live view is not covered */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-gray-100 dark:from-zinc-900/20 via-white dark:via-black to-white dark:to-black pointer-events-none" />

        {/* Global header with search */}
        <header className="relative z-10 shrink-0 h-14 px-4 flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <GlobalSearchBar
            className="ml-auto"
            placeholder=""
            onSelectProperty={(id) => { setActiveTab('Properties'); setInitialSelectedPropertyId(id); }}
            onSelectContact={(id) => { setActiveTab('Contacts'); setInitialSelectedContactId(id); }}
            onSelectDeal={(id) => { setActiveTab('Deals'); setInitialSelectedDealId(id); }}
            onSelectViewing={(id) => { setActiveTab('Calendar'); setInitialSelectedViewingId(id); }}
          />
        </header>

        <div className="relative z-10 flex-1 overflow-hidden min-h-0">
          {activeTab === 'Dashboard' && (
            <Dashboard
              user={user}
              onAddProperty={() => { setActiveTab('Properties'); setShowPropertiesAddPanel(true); }}
              onSelectProperty={(id) => { setActiveTab('Properties'); setInitialSelectedPropertyId(id); }}
              onOpenCalendar={() => setActiveTab('Calendar')}
            />
          )}
          {activeTab === 'Properties' && (
            <Properties
              showAddPanel={showPropertiesAddPanel}
              onAddPanelChange={setShowPropertiesAddPanel}
              initialSelectedPropertyId={initialSelectedPropertyId}
              onClearInitialSelection={() => setInitialSelectedPropertyId(null)}
              isDarkMode={isDarkMode}
            />
          )}
          {activeTab === 'Contacts' && (
            <Contacts
              initialSelectedContactId={initialSelectedContactId}
              onClearInitialContactSelection={() => setInitialSelectedContactId(null)}
            />
          )}
          {activeTab === 'Deals' && (
            <Deals
              onSelectContact={(id) => { setActiveTab('Contacts'); setInitialSelectedContactId(id); }}
              onSelectProperty={(id) => { setActiveTab('Properties'); setInitialSelectedPropertyId(id); }}
              initialSelectedDealId={initialSelectedDealId}
              onClearInitialDealSelection={() => setInitialSelectedDealId(null)}
            />
          )}
          {activeTab === 'Calendar' && <CalendarView />}
          {activeTab === 'Messages' && user && <MessagesView currentUser={user} />}

          {activeTab !== 'Dashboard' && activeTab !== 'Properties' && activeTab !== 'Contacts' && activeTab !== 'Deals' && activeTab !== 'Calendar' && activeTab !== 'Messages' && (
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
        </div>
      </main>

      {showUserSettings && user && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onSignOut={handleLogout}
        />
      )}
    </div>
  );
}
