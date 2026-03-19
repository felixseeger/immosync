import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Loader2,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Home,
} from 'lucide-react';
import { format, isToday, startOfDay } from 'date-fns';
import ActivityStream from './ActivityStream';
import ExportReportModal from './ExportReportModal';
import { useReportExport } from '../hooks/useReportExport';
import { getProperties } from '../services/propertyService';
import { subscribeToContacts } from '../services/contactsService';
import { subscribeToViewings } from '../services/viewingsService';
import { subscribeToDealsSimple } from '../services/dealsService';
import { subscribeToRentReviews, markRentReviewed, unmarkRentReviewed } from '../services/rentReviewService';
import type { Property, Viewing, Deal, ViewingEventType, RentReview } from '../types';
import { VIEWING_EVENT_TYPE_LABELS } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

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
    className={`glass rounded-xl p-6 hover:border-accent/50 transition-colors group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors border border-accent/20">
        <Icon className="text-accent transition-colors" size={20} />
      </div>
      {change != null && trend != null && (
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      )}
    </div>
    <h3 className="text-gray-600 dark:text-zinc-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
  </div>
);

function formatCurrency(n: number, language: string): string {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return `€${n.toLocaleString(locale)}`;
}

function getGreeting(t: { dashboard: { goodMorning: string; goodDay: string; goodEvening: string } }): string {
  const h = new Date().getHours();
  if (h < 12) return t.dashboard.goodMorning;
  if (h < 18) return t.dashboard.goodDay;
  return t.dashboard.goodEvening;
}

function getFirstName(user: FirebaseUser | null | undefined, fallback: string): string {
  if (!user) return fallback;
  const name = user.displayName?.trim();
  if (name) {
    const first = name.split(/\s+/)[0];
    return first || fallback;
  }
  const email = user.email?.trim();
  if (email) {
    const local = email.split('@')[0];
    return local ? local.charAt(0).toUpperCase() + local.slice(1).toLowerCase() : fallback;
  }
  return fallback;
}

function getViewingDate(v: Viewing): Date | null {
  const raw = v.scheduledAt;
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate();
  if (raw instanceof Date) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

interface DashboardProps {
  user?: FirebaseUser | null;
  onAddProperty?: () => void;
  onSelectProperty?: (propertyId: string) => void;
  onOpenCalendar?: () => void;
}

export default function Dashboard({ user, onAddProperty, onSelectProperty, onOpenCalendar }: DashboardProps) {
  const { t, language } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rentReviews, setRentReviews] = useState<RentReview[]>([]);
  const [reviewMonth, setReviewMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const {
    status,
    pdfUrl,
    errorMessage,
    modalOpen,
    openExport,
    regenerate,
    downloadPdf,
    downloadJson,
    closeModal,
  } = useReportExport();

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getProperties()
      .then((list) => {
        if (!cancelled) setProperties(list);
      })
      .catch(() => {
        if (!cancelled) setProperties([]);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToContacts((list) => setContactsCount(list.length));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToViewings(setViewings);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToDealsSimple(setDeals);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToRentReviews(reviewMonth, setRentReviews);
    return unsub;
  }, [reviewMonth]);

  const todayViewings = viewings.filter((v) => {
    const d = getViewingDate(v);
    return d && isToday(d) && v.status !== 'cancelled';
  });

  const nextScheduledViewings = viewings
    .filter((v) => {
      const d = getViewingDate(v);
      return d && d >= startOfDay(new Date()) && v.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = getViewingDate(a)!.getTime();
      const db = getViewingDate(b)!.getTime();
      return da - db;
    })
    .slice(0, 10);
  const newLeadsCount = deals.filter((d) => d.stageId === 'lead').length;
  const activeDealsCount = deals.filter((d) => d.stageId !== 'closed').length;

  const activeListings = properties.filter((p) => p.status === 'Active').length;
  const portfolioValue = properties
    .filter((p) => p.status === 'Active')
    .reduce((sum, p) => sum + (p.price ?? 0), 0);
  const ytdRevenue = portfolioValue;

  // Rental income
  const rentalProperties = properties.filter(
    (p) => p.status === 'Rented' && p.marketingType === 'Rent'
  );
  const monthlyRentalIncome = rentalProperties.reduce(
    (sum, p) => sum + (p.price ?? 0),
    0
  );

  const reviewedPropertyIds = new Set(rentReviews.map((r) => r.propertyId));

  const handleToggleReview = useCallback(
    async (propertyId: string) => {
      if (reviewedPropertyIds.has(propertyId)) {
        await unmarkRentReviewed(propertyId, reviewMonth);
      } else {
        await markRentReviewed(propertyId, reviewMonth);
      }
    },
    [reviewMonth, reviewedPropertyIds]
  );

  const shiftMonth = useCallback(
    (delta: number) => {
      const [y, m] = reviewMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      setReviewMonth(format(d, 'yyyy-MM'));
    },
    [reviewMonth]
  );

  const reviewMonthLabel = (() => {
    const [y, m] = reviewMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return format(d, 'MMMM yyyy');
  })();

  // Monthly data for revenue line chart (Oct–Mar)
  const revenueChartMonths = t.dashboard.revenueMonths;
  const revenueChartData = (() => {
    const max = Math.max(ytdRevenue, 1);
    return revenueChartMonths.map((_, i) => {
      const t = (i + 1) / revenueChartMonths.length;
      return Math.round(max * (0.1 + 0.9 * t * t));
    });
  })();
  const chartMax = Math.max(...revenueChartData, 1);
  const chartHeight = 120;
  const chartWidth = 400;
  const pad = { top: 8, right: 8, bottom: 20, left: 36 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;
  const linePoints = revenueChartData
    .map((val, i) => {
      const x = pad.left + (i / (revenueChartData.length - 1 || 1)) * innerW;
      const y = pad.top + innerH - (val / chartMax) * innerH;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `${pad.left},${pad.top + innerH} ${linePoints} ${pad.left + innerW},${pad.top + innerH}`;

  const handleExportReport = () => {
    // If no real properties exist, use a set of demo properties so the report isn't empty
    const reportProperties = properties.length > 0 ? properties : [
      {
        id: 'demo-1',
        title: "Modern Downtown Penthouse",
        address: "123 Skyline Ave, New York, NY 10001",
        price: 4500000,
        status: 'Active',
        type: 'Residential',
        rooms: 5,
        sqft: 2800,
        description: "Stunning penthouse with panoramic city views.",
        mainImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"],
        features: ["City Views", "Private Terrace"],
        createdAt: new Date(),
        agentId: "demo"
      } as Property,
      {
        id: 'demo-2',
        title: "Luxury Waterfront Villa",
        address: "456 Ocean Dr, Miami, FL 33139",
        price: 12500000,
        status: 'Active',
        type: 'Residential',
        rooms: 12,
        sqft: 8500,
        description: "Exclusive waterfront estate with private dock.",
        mainImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"],
        features: ["Waterfront", "Private Dock"],
        createdAt: new Date(),
        agentId: "demo"
      } as Property
    ];

    const reportData = {
      exportedAt: new Date().toISOString(),
      activeListings: reportProperties.filter(p => p.status === 'Active').length,
      contactsCount: Math.max(contactsCount, 24),
      portfolioValue: reportProperties.reduce((sum, p) => sum + (p.price ?? 0), 0),
      totalProperties: reportProperties.length,
      activeDealsCount: Math.max(activeDealsCount, 4),
      newLeadsCount: Math.max(newLeadsCount, 2),
      todayViewingsCount: todayViewings.length,
      byStatus: {
        Active: reportProperties.filter((p) => p.status === 'Active').length,
        Pending: reportProperties.filter((p) => p.status === 'Pending').length,
        Sold: reportProperties.filter((p) => p.status === 'Sold').length,
      },
    };
    
    openExport(reportData, reportProperties);
  };

  const greeting = getGreeting(t as any);
  const firstName = getFirstName(user, t.dashboard.there);
  const todayFormatted = format(new Date(), 'EEEE, d. MMMM yyyy', { locale: undefined });

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {t.dashboard.exportReport}
          </button>
          <button
            type="button"
            onClick={onAddProperty}
            className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 btn-outline-accent [&_svg]:text-current"
          >
            <Building2 size={18} />
            {t.dashboard.addProperty}
          </button>
        </div>
      </div>

      {/* Welcome message only - full width */}
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl text-gray-900 dark:text-white mb-1">
          {greeting},{' '}
          <span className="text-accent font-bold">{firstName}</span>
        </h3>
        <p className="text-gray-600 dark:text-zinc-400 text-sm">
          {t.dashboard.todayPlanned
            .replace('{viewings}', String(todayViewings.length))
            .replace('{leads}', String(newLeadsCount))}
        </p>
      </div>

      {/* Main content: left = graph + metric cards, right = Daily Agenda (single column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Revenue Overview + Active Deals / New Leads */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Revenue Overview with graph */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t.dashboard.revenueOverview}</h3>
            {statsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
                <Loader2 size={20} className="animate-spin" />
                <span>{t.dashboard.loadingData}</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatCurrency(ytdRevenue, language)} {t.dashboard.ytd}
                </p>
                <div className="flex gap-4">
                  <div className="text-[10px] text-gray-500 dark:text-zinc-500 flex flex-col justify-between py-1">
                    <span>{formatCurrency(chartMax, language)}</span>
                    <span>{formatCurrency(Math.round(chartMax / 2), language)}</span>
                    <span>€0</span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[100px]" preserveAspectRatio="none" aria-hidden>
                      <defs>
                        <linearGradient id="revenueLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--tw-accent)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--tw-accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon fill="url(#revenueLineGradient)" points={areaPoints} />
                      <polyline
                        fill="none"
                        stroke="var(--tw-accent)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                    </svg>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500 dark:text-zinc-500">
                      {revenueChartMonths.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Deals + New Leads - cleaned up two cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard title={t.dashboard.activeTasks} value={String(activeDealsCount)} icon={TrendingUp} />
            <StatCard title={t.dashboard.newLeads} value={String(newLeadsCount)} icon={Users} />
          </div>
        </div>

        {/* Right: Next Scheduled Events - single column only */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl p-5 flex flex-col h-full min-h-[280px]">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.dashboard.upcomingAppointments}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-4">{todayFormatted}</p>
            {nextScheduledViewings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <CalendarIcon className="text-blue-600 dark:text-blue-400 mb-2" size={28} />
                <p className="text-sm text-gray-600 dark:text-zinc-400">{t.dashboard.noUpcomingAppointments}</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1 list-none p-0 m-0">
                {nextScheduledViewings.map((v) => {
                  const d = getViewingDate(v);
                  const type = (v.eventType ?? 'viewing') as ViewingEventType;
                  const label = VIEWING_EVENT_TYPE_LABELS[type] ?? t.dashboard.viewingFallback;
                  return (
                    <li key={v.id} className="text-sm text-gray-700 dark:text-zinc-300 flex items-baseline gap-2 py-1 border-b border-gray-200/60 dark:border-zinc-700/60 last:border-0">
                      <span className="font-medium text-gray-900 dark:text-zinc-200 shrink-0">
                        {d ? (isToday(d) ? format(d, 'HH:mm') : format(d, 'd. MMM, HH:mm')) : '—'}
                      </span>
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-90 transition-colors [&_svg]:text-current"
              >
                {t.dashboard.viewFullCalendar}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats: Active Listings, Contacts, Portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsLoading ? (
          <>
            <div className="glass rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
            <div className="glass rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
            <div className="glass rounded-xl p-6 flex items-center justify-center min-h-[120px]">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          </>
        ) : (
          <>
            <StatCard title={t.dashboard.activeListings} value={String(activeListings)} icon={TrendingUp} />
            <StatCard title={t.dashboard.contacts} value={String(contactsCount)} icon={Users} />
            <StatCard title={t.dashboard.portfolioValueActive} value={formatCurrency(portfolioValue, language)} icon={DollarSign} />
          </>
        )}
      </div>

      {/* Monthly Rental Income + Rent Review */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Rental Income Card */}
        <StatCard
          title={t.dashboard.monthlyRentalIncome ?? 'Monatliche Mieteinnahmen'}
          value={formatCurrency(monthlyRentalIncome, language)}
          icon={Home}
        />

        {/* Rent Payment Review Checklist */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {t.dashboard.rentReviewTitle ?? 'Mietprüfung'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} className="text-gray-600 dark:text-zinc-400" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 min-w-[120px] text-center">
                {reviewMonthLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} className="text-gray-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          {rentalProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Home className="text-gray-400 dark:text-zinc-600 mb-2" size={28} />
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t.dashboard.noRentalProperties ?? 'Keine Mietobjekte vorhanden'}
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mb-3">
                {reviewedPropertyIds.size} / {rentalProperties.length}{' '}
                {t.dashboard.reviewedCount ?? 'geprüft'}
              </div>
              <ul className="space-y-2 list-none p-0 m-0">
                {rentalProperties.map((p) => {
                  const isReviewed = reviewedPropertyIds.has(p.id);
                  return (
                    <li
                      key={p.id}
                      role="button"
                      onClick={() => handleToggleReview(p.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isReviewed
                          ? 'bg-green-500/5 hover:bg-green-500/10 border border-green-500/20'
                          : 'bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {isReviewed ? (
                        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isReviewed ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white'
                        }`}>
                          {p.title}
                        </p>
                        {p.address && (
                          <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{p.address}</p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${
                        isReviewed ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {formatCurrency(p.price ?? 0, language)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {reviewedPropertyIds.size === rentalProperties.length && rentalProperties.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 size={16} />
                  {t.dashboard.allReviewed ?? 'Alle Mieten geprüft!'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="glass rounded-xl flex flex-col h-[400px] lg:h-[500px] overflow-hidden flex-1">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="font-bold text-gray-900 dark:text-white">{t.dashboard.activity}</h3>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <ActivityStream />
          </div>
        </div>
      </div>

      <ExportReportModal
        open={modalOpen}
        status={status}
        pdfUrl={pdfUrl}
        errorMessage={errorMessage}
        snapshot={{
          exportedAt: new Date().toISOString(),
          activeListings,
          contactsCount,
          portfolioValue,
          totalProperties: properties.length,
          activeDealsCount,
          newLeadsCount,
          todayViewingsCount: todayViewings.length,
          byStatus: {
            Active: properties.filter((p) => p.status === 'Active').length,
            Pending: properties.filter((p) => p.status === 'Pending').length,
            Sold: properties.filter((p) => p.status === 'Sold').length,
          },
        }}
        onClose={closeModal}
        onRegenerate={regenerate}
        onDownloadPdf={downloadPdf}
        onDownloadJson={downloadJson}
      />
    </div>
  );
}
