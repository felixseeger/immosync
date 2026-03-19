import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CheckSquare, 
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
  Languages,
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
import CookieConsent from './components/CookieConsent';
import CookieSettingsButton from './components/CookieSettingsButton';
import ScrollToTop from './components/ScrollToTop';
import { upsertUserProfile } from './services/usersService';
import { sfx } from './utils/sfx';
import AnimatedLink from './components/AnimatedLink';
import LiquidGradientBackground from './components/LiquidGradientBackground';
import Footer from './components/layout/Footer';
import { useLanguage } from './contexts/LanguageContext';
import type { Language } from './i18n';

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: { icon: React.ComponentType<{ size?: number }>, label: string, active?: boolean, onClick: () => void; collapsed?: boolean }) => (
  <div className={`relative ${collapsed ? 'px-0 flex justify-center md:justify-center' : 'px-4'}`}>
    {active && !collapsed && (
      <motion.div
        layoutId="active-nav"
        className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400 rounded-r-full"
      />
    )}
    <AnimatedLink
      active={active}
      onClick={onClick}
      className={`flex items-center gap-3 py-3 w-full cursor-pointer ${collapsed ? 'justify-center md:justify-center px-0' : ''} ${active ? 'text-blue-600 dark:text-blue-400 focus:ring-blue-500/50' : ''}`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <span className="shrink-0 [&_svg]:size-5">
        <Icon size={20} />
      </span>
      {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </AnimatedLink>
  </div>
);

const LANGUAGE_OPTIONS: Array<{ code: Language; flagClass: string; labelKey: 'german' | 'english' | 'french' | 'chinese' | 'japanese' }> = [
  { code: 'de', flagClass: 'fi fi-de', labelKey: 'german' },
  { code: 'en', flagClass: 'fi fi-gb', labelKey: 'english' },
  { code: 'fr', flagClass: 'fi fi-fr', labelKey: 'french' },
  { code: 'zh', flagClass: 'fi fi-cn', labelKey: 'chinese' },
  { code: 'ja', flagClass: 'fi fi-jp', labelKey: 'japanese' },
];

export default function App() {
  const { t, language, setLanguage } = useLanguage();
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
  const [showLanguagePopover, setShowLanguagePopover] = useState(false);
  const [isMdOrLarger, setIsMdOrLarger] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  const [isSidebarExpandable, setIsSidebarExpandable] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1796px)').matches);
  const languagePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => setIsMdOrLarger(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1796px)');
    const handler = () => setIsSidebarExpandable(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!showLanguagePopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (languagePopoverRef.current && !languagePopoverRef.current.contains(e.target as Node)) {
        setShowLanguagePopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguagePopover]);

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
      <div className="min-h-screen bg-app-light dark:bg-app-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-black rotate-45" />
          </div>
          <p className="text-gray-500 dark:text-zinc-500 technical-label animate-pulse">{t.app.initializing}</p>
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

  const effectiveCollapsed = !isSidebarExpandable || sidebarCollapsed;

  const closeSidebar = () => {
    sfx.menuClose();
    setSidebarOpen(false);
  };
  const openSidebar = () => {
    sfx.menuOpen();
    setSidebarOpen(true);
  };
  const goTo = (tab: string) => {
    sfx.menuSelect();
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-app-light dark:bg-app-dark overflow-hidden font-sans text-gray-900 dark:text-zinc-100">
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
        className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-app-light dark:bg-app-dark border-r border-gray-200 dark:border-border-dark ease-out
          w-64 md:transition-[width] md:duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${effectiveCollapsed ? 'md:w-[72px]' : 'md:w-64'}
          transition-transform duration-200 md:transform-none
        `}
      >
        <div className={`relative flex items-center gap-2 shrink-0 border-b border-gray-200 dark:border-border-dark ${(effectiveCollapsed && isMdOrLarger) ? 'p-3 md:justify-center md:flex-col md:gap-2 min-h-[72px]' : 'p-4 md:px-4 h-[72px]'} transition-all duration-200`}>
          {(effectiveCollapsed && isMdOrLarger) ? (
            <motion.span
              className="shrink-0 hidden md:inline-flex"
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.9, 1, 0.95] }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              aria-hidden
            >
              <img src="/img/logo-icon.svg" alt="IMMOSYNC" className="w-8 h-8" />
            </motion.span>
          ) : (
            <>
              <img src="/img/logo-icon.svg" alt="IMMOSYNC" className="w-8 h-8 shrink-0" />
              <img src="/img/logo-type.svg" alt="IMMOSYNC" className="h-[20px] shrink-0 hidden sm:block dark:sm:hidden" />
              <img src="/img/logo-type-white.svg" alt="IMMOSYNC" className="h-[20px] shrink-0 hidden dark:sm:block" />
            </>
          )}
          {/* Mobile: close button */}
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden ml-auto p-2 rounded-lg border-2 border-transparent text-gray-500 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
            aria-label={t.app.closeMenu}
          >
            <X size={20} />
          </button>
          {/* Desktop: collapse toggle (only when expanded and viewport >= 1796px) */}
          {!effectiveCollapsed && isSidebarExpandable && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="hidden md:flex ml-auto p-2 rounded-lg border-2 border-transparent text-gray-500 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
              aria-label={t.app.collapseSidebar}
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 mt-4 pt-[5px] overflow-y-auto custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label={t.nav.dashboard} active={activeTab === 'Dashboard'} onClick={() => goTo('Dashboard')} collapsed={effectiveCollapsed && isMdOrLarger} />
          <SidebarItem icon={Building2} label={t.nav.properties} active={activeTab === 'Properties'} onClick={() => goTo('Properties')} collapsed={effectiveCollapsed && isMdOrLarger} />
          <SidebarItem icon={Users} label={t.nav.contacts} active={activeTab === 'Contacts'} onClick={() => goTo('Contacts')} collapsed={effectiveCollapsed && isMdOrLarger} />
          <SidebarItem icon={CheckSquare} label={t.nav.deals} active={activeTab === 'Deals'} onClick={() => goTo('Deals')} collapsed={effectiveCollapsed && isMdOrLarger} />
          <SidebarItem icon={Calendar} label={t.nav.calendar} active={activeTab === 'Calendar'} onClick={() => goTo('Calendar')} collapsed={effectiveCollapsed && isMdOrLarger} />
          <SidebarItem icon={MessageSquare} label={t.nav.messages} active={activeTab === 'Messages'} onClick={() => goTo('Messages')} collapsed={effectiveCollapsed && isMdOrLarger} />
        </nav>

        <div className={`p-4 border-t border-gray-200 dark:border-border-dark space-y-2 ${effectiveCollapsed ? 'md:px-2' : ''}`}>
          {/* Language selector */}
          <div className={`flex items-center justify-between px-2 py-1 ${effectiveCollapsed ? 'md:justify-center md:flex-col md:gap-1' : ''}`}>
            {effectiveCollapsed && isMdOrLarger ? (
              <div ref={languagePopoverRef} className="hidden md:block relative">
                <button
                  type="button"
                  onClick={() => setShowLanguagePopover((v) => !v)}
                  aria-label={t.app.language}
                  aria-expanded={showLanguagePopover}
                  aria-haspopup="true"
                  title={t.app[LANGUAGE_OPTIONS.find((o) => o.code === language)?.labelKey ?? 'german']}
                  className="flex justify-center w-full p-1 rounded-lg transition-colors"
                >
                  <span className={`${LANGUAGE_OPTIONS.find((o) => o.code === language)?.flagClass ?? 'fi fi-de'} block h-[20px] w-[28px] rounded-[2px]`} />
                </button>
                {showLanguagePopover && (
                  <div
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 py-2 px-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-app-light dark:bg-app-dark shadow-xl z-50 flex flex-col gap-1 min-w-[56px]"
                    role="menu"
                    aria-label={t.app.language}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => {
                      const active = language === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          aria-label={t.app[opt.labelKey]}
                          title={t.app[opt.labelKey]}
                          onClick={() => { setLanguage(opt.code); setShowLanguagePopover(false); }}
                          className={`flex items-center justify-center p-2 rounded-lg transition-colors ${active ? 'bg-accent/20 border-2 border-accent/50' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border-2 border-transparent'}`}
                        >
                          <span className={`${opt.flagClass} block h-[18px] w-[26px] rounded-[2px]`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {!effectiveCollapsed && <span className="sr-only">{t.app.language}</span>}
                <div className="flex items-center gap-2 min-w-0">
                  {!effectiveCollapsed && <Languages size={14} className="text-gray-500 dark:text-zinc-400 shrink-0" />}
                  <div
                    className="relative flex items-center gap-1 rounded-lg border border-gray-300 dark:border-zinc-700 p-1"
                    role="radiogroup"
                    aria-label={t.app.language}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => {
                      const active = language === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={t.app[opt.labelKey]}
                          title={t.app[opt.labelKey]}
                          onClick={() => setLanguage(opt.code)}
                          className={`relative z-10 h-7 w-7 rounded-md transition-colors duration-200 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'}`}
                        >
                          <span className={`${opt.flagClass} block h-[14px] w-[20px] mx-auto rounded-[2px]`} aria-hidden />
                          {active && (
                            <motion.span
                              layoutId="active-language-flag"
                              className="absolute inset-0 -z-10 rounded-md border border-accent/50 bg-white dark:bg-zinc-800"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme toggle - hide labels when collapsed */}
          <div className={`flex items-center justify-between px-2 py-1 ${effectiveCollapsed ? 'md:justify-center md:flex-col md:gap-1' : ''}`}>
            {!effectiveCollapsed && <span className="text-xs text-gray-600 dark:text-zinc-600 uppercase tracking-wider font-medium">{t.app.theme}</span>}
            <div className="flex items-center gap-2">
              {!effectiveCollapsed && (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">
                  {isDarkMode ? t.app.dark : t.app.light}
                </span>
              )}
              <button
                onClick={() => setIsDarkMode(d => !d)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                title={isDarkMode ? t.app.switchToLight : t.app.switchToDark}
              >
                {isDarkMode ? <Sun size={16} className="text-accent" /> : <Moon size={16} />}
              </button>
            </div>
          </div>
          {/* User badge */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(false); setShowUserSettings(true); }}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors w-full text-left ${effectiveCollapsed ? 'md:justify-center md:px-0' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-800 border border-gray-300 dark:border-border-dark overflow-hidden shrink-0">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || user?.email || 'U')}`} alt={t.app.avatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              {!effectiveCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.displayName || t.app.user}</p>
                  <p className="text-xs text-gray-600 dark:text-zinc-500 truncate">{user?.email}</p>
                </div>
              )}
              {!effectiveCollapsed && <ChevronUp size={14} className="text-gray-600 dark:text-zinc-500 shrink-0 rotate-180" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-app-light dark:bg-app-dark flex flex-col">
        {/* Liquid gradient page background (light/dark variant) */}
        <LiquidGradientBackground
          variant={isDarkMode ? 'dark' : 'light'}
          className="absolute inset-0 z-0 pointer-events-none opacity-50"
        />

        {/* Global header with search */}
        <header className="relative z-20 shrink-0 h-[72px] min-h-[72px] px-4 flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 bg-app-light/80 dark:bg-app-dark/80 backdrop-blur-md">
          <button
            type="button"
            onClick={openSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg border-2 border-transparent text-gray-600 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={t.app.openMenu}
          >
            <Menu size={24} />
          </button>
          {/* Mobile: logo between burger and search */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            <img src="/img/logo-icon.svg" alt="IMMOSYNC" className="w-7 h-7 shrink-0" />
            <img src="/img/logo-type.svg" alt="IMMOSYNC" className="h-[16px] shrink-0 dark:hidden" />
            <img src="/img/logo-type-white.svg" alt="IMMOSYNC" className="h-[16px] shrink-0 hidden dark:block" />
          </div>
          {/* When aside collapsed (desktop): logo text + expand toggle in header */}
          {effectiveCollapsed && isSidebarExpandable && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <img src="/img/logo-type.svg" alt="IMMOSYNC" className="h-[20px] shrink-0 dark:hidden" />
              <img src="/img/logo-type-white.svg" alt="IMMOSYNC" className="h-[20px] shrink-0 hidden dark:block" />
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-lg border-2 border-transparent text-gray-500 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label={t.app.expandSidebar}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          <GlobalSearchBar
            className="ml-auto"
            placeholder={t.search.placeholder}
            onSelectProperty={(id) => { setActiveTab('Properties'); setInitialSelectedPropertyId(id); }}
            onSelectContact={(id) => { setActiveTab('Contacts'); setInitialSelectedContactId(id); }}
            onSelectDeal={(id) => { setActiveTab('Deals'); setInitialSelectedDealId(id); }}
            onSelectViewing={(id) => { setActiveTab('Calendar'); setInitialSelectedViewingId(id); }}
          />
        </header>

        <div className="relative z-10 flex-1 overflow-hidden min-h-0">
          {activeTab === 'Dashboard' && (
            <Dashboard
              user={user!}
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
              onSelectProperty={(id) => { setActiveTab('Properties'); setInitialSelectedPropertyId(id); }}
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
        <Footer />
      </main>

      {showUserSettings && user && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onSignOut={handleLogout}
        />
      )}

      <CookieConsent />
      <CookieSettingsButton />
      <ScrollToTop className="left-6 right-auto lg:left-10 lg:right-auto" />
    </div>
  );
}
