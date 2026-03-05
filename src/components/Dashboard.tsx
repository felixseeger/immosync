import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import PropertyMap from './PropertyMap';
import ActivityStream from './ActivityStream';

const StatCard = ({ title, value, change, trend, icon: Icon }: { title: string, value: string, change: string, trend: 'up' | 'down', icon: any }) => (
  <div className="bg-panel-dark border border-border-dark rounded-xl p-6 hover:border-neon-yellow/50 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-neon-yellow/10 transition-colors">
        <Icon className="text-zinc-400 group-hover:text-neon-yellow transition-colors" size={20} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
        trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
      }`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <h3 className="text-zinc-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </div>
);

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-zinc-500 text-sm">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-zinc-900 border border-border-dark rounded-lg text-sm text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-neon-yellow text-black font-bold rounded-lg text-sm hover:bg-neon-yellow/90 transition-colors">
            Add Property
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Active Deals" 
          value="12" 
          change="+2.4%" 
          trend="up" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="New Leads" 
          value="48" 
          change="+12.5%" 
          trend="up" 
          icon={Users} 
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$1.2M" 
          change="-0.8%" 
          trend="down" 
          icon={DollarSign} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-panel-dark border border-border-dark rounded-xl p-1 flex flex-col h-[500px] lg:h-auto">
          <div className="p-4 border-b border-border-dark flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-neon-yellow" />
              Portfolio Map
            </h3>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Live View</span>
            </div>
          </div>
          <div className="flex-1 relative rounded-b-lg overflow-hidden">
            <PropertyMap />
          </div>
        </div>

        {/* Activity Stream Section */}
        <div className="bg-panel-dark border border-border-dark rounded-xl flex flex-col h-[500px] lg:h-auto overflow-hidden">
          <div className="p-4 border-b border-border-dark">
            <h3 className="font-bold text-white">Recent Activity</h3>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <ActivityStream />
          </div>
        </div>
      </div>
    </div>
  );
}
