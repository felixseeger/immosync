import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Building2,
  Loader2
} from 'lucide-react';
import ActivityStream from './ActivityStream';
import { getProperties } from '../services/propertyService';
import { subscribeToContacts } from '../services/contactsService';
import type { Property } from '../types';

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
}) => (
  <div
    role={onClick ? 'button' : undefined}
    onClick={onClick}
    className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 hover:border-neon-yellow/50 transition-colors group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-neon-yellow/10 transition-colors">
        <Icon className="text-gray-600 dark:text-zinc-400 group-hover:text-neon-yellow transition-colors" size={20} />
      </div>
      {change != null && trend != null && (
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      )}
    </div>
    <h3 className="text-gray-600 dark:text-zinc-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
  </div>
);

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface DashboardProps {
  onAddProperty?: () => void;
  onSelectProperty?: (propertyId: string) => void;
}

export default function Dashboard({ onAddProperty, onSelectProperty }: DashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getProperties()
      .then((list) => { if (!cancelled) setProperties(list); })
      .catch(() => { if (!cancelled) setProperties([]); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = subscribeToContacts((list) => setContactsCount(list.length));
    return unsub;
  }, []);

  const activeListings = properties.filter((p) => p.status === 'Active').length;
  const portfolioValue = properties
    .filter((p) => p.status === 'Active')
    .reduce((sum, p) => sum + (p.price ?? 0), 0);

  const handleExportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      activeListings,
      contactsCount,
      portfolioValue,
      totalProperties: properties.length,
      byStatus: {
        Active: properties.filter((p) => p.status === 'Active').length,
        Pending: properties.filter((p) => p.status === 'Pending').length,
        Sold: properties.filter((p) => p.status === 'Sold').length,
      },
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitesync-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-600 dark:text-zinc-500 text-sm">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-zinc-600 transition-colors"
          >
            Export Report
          </button>
          <button
            type="button"
            onClick={onAddProperty}
            className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border-2 border-[#D9FF00] bg-[#D9FF00]/10 text-[#D9FF00] hover:bg-[#D9FF00]/20 transition-colors"
          >
            <Building2 size={18} className="text-[#D9FF00]" />
            Add Property
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsLoading ? (
          <>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-neon-yellow" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-neon-yellow" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-neon-yellow" />
            </div>
          </>
        ) : (
          <>
            <StatCard
              title="Active Listings"
              value={String(activeListings)}
              icon={TrendingUp}
            />
            <StatCard
              title="Contacts"
              value={String(contactsCount)}
              icon={Users}
            />
            <StatCard
              title="Portfolio Value (Active)"
              value={formatCurrency(portfolioValue)}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Activity Stream Section */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex flex-col h-[500px] lg:h-auto overflow-hidden flex-1">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <ActivityStream />
          </div>
        </div>
      </div>
    </div>
  );
}
