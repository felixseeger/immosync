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
  LogOut
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
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 group ${active ? 'text-neon-yellow' : 'text-zinc-400 hover:text-white'}`}
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-neon-yellow rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-black rotate-45" />
          </div>
          <p className="text-zinc-500 technical-label animate-pulse">Initializing SiteSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-dark flex flex-col bg-black z-20">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-neon-yellow rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black rotate-45" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">SITESYNC<span className="text-neon-yellow">.IO</span></h1>
        </div>

        <nav className="flex-1 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <SidebarItem icon={Building2} label="Properties" active={activeTab === 'Properties'} onClick={() => setActiveTab('Properties')} />
          <SidebarItem icon={Users} label="Contacts" active={activeTab === 'Contacts'} onClick={() => setActiveTab('Contacts')} />
          <SidebarItem icon={Briefcase} label="Deals" active={activeTab === 'Deals'} onClick={() => setActiveTab('Deals')} />
          <SidebarItem icon={Calendar} label="Calendar" active={activeTab === 'Calendar'} onClick={() => setActiveTab('Calendar')} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'Messages'} onClick={() => setActiveTab('Messages')} />
        </nav>

        <div className="p-4 border-t border-border-dark space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-panel-dark transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-border-dark overflow-hidden">
              <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user.displayName || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <Settings size={16} className="text-zinc-500 group-hover:text-white" />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />
        
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Properties' && <Properties />}
        
        {activeTab !== 'Dashboard' && activeTab !== 'Properties' && (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="animate-spin-slow" size={32} />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">{activeTab} Module</h3>
              <p className="text-sm">This module is currently under development.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
