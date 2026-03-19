import React, { useState, useEffect, useCallback } from 'react';
import {
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
import ExportReportModal from './ExportReportModal';
import { useReportExport } from '../hooks/useReportExport';
import { getProperties } from '../services/propertyService';
import { subscribeToContacts } from '../services/contactsService';
import { subscribeToViewings } from '../services/viewingsService';
import { subscribeToDealsSimple } from '../services/dealsService';
import { subscribeToRentReviews, markRentReviewed, unmarkRentReviewed } from '../services/rentReviewService';
import { subscribeToRentPayments, markRentPaid, unmarkRentPaid } from '../services/rentPaymentService';
import type { Property, Viewing, Deal, ViewingEventType, RentReview, RentPayment } from '../types';
import { VIEWING_EVENT_TYPE_LABELS } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

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

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">{value}</p>
    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 whitespace-nowrap">{label}</p>
  </div>
);

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
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
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
      .then((list) => { if (!cancelled) setProperties(list); })
      .catch(() => { if (!cancelled) setProperties([]); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
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

  useEffect(() => {
    const unsub = subscribeToRentPayments(reviewMonth, setRentPayments);
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
    .sort((a, b) => getViewingDate(a)!.getTime() - getViewingDate(b)!.getTime())
    .slice(0, 10);

  const newLeadsCount = deals.filter((d) => d.stageId === 'lead').length;
  const activeDealsCount = deals.filter((d) => d.stageId !== 'closed').length;
  const activeListings = properties.filter((p) => p.status === 'Active').length;
  const portfolioValue = properties.filter((p) => p.status === 'Active').reduce((sum, p) => sum + (p.price ?? 0), 0);

  const rentalProperties = properties.filter(
    (p) => (p.status === 'Rented' || p.status === 'For Rent') && p.marketingType === 'Rent'
  );
  const monthlyRentalIncome = rentalProperties.reduce((sum, p) => sum + (p.price ?? 0), 0);

  const reviewedPropertyIds = new Set(rentReviews.map((r) => r.propertyId));
  const paidPropertyIds = new Set(rentPayments.map((p) => p.propertyId));

  const handleToggleReview = useCallback(async (propertyId: string) => {
    if (reviewedPropertyIds.has(propertyId)) {
      await unmarkRentReviewed(propertyId, reviewMonth);
    } else {
      await markRentReviewed(propertyId, reviewMonth);
    }
  }, [reviewMonth, reviewedPropertyIds]);

  const handleTogglePaid = useCallback(async (propertyId: string) => {
    if (paidPropertyIds.has(propertyId)) {
      await unmarkRentPaid(propertyId, reviewMonth);
    } else {
      await markRentPaid(propertyId, reviewMonth);
    }
  }, [reviewMonth, paidPropertyIds]);

  const shiftMonth = useCallback((delta: number) => {
    const [y, m] = reviewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setReviewMonth(format(d, 'yyyy-MM'));
  }, [reviewMonth]);

  const reviewMonthLabel = (() => {
    const [y, m] = reviewMonth.split('-').map(Number);
    return format(new Date(y, m - 1, 1), 'MMMM yyyy');
  })();

  const handleExportReport = () => {
    const reportProperties = properties.length > 0 ? properties : [
      { id: 'demo-1', title: 'Modern Downtown Penthouse', address: '123 Skyline Ave, New York, NY 10001', price: 4500000, status: 'Active', type: 'Residential', rooms: 5, sqft: 2800, description: 'Stunning penthouse with panoramic city views.', mainImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'], features: ['City Views', 'Private Terrace'], createdAt: new Date(), agentId: 'demo' } as Property,
      { id: 'demo-2', title: 'Luxury Waterfront Villa', address: '456 Ocean Dr, Miami, FL 33139', price: 12500000, status: 'Active', type: 'Residential', rooms: 12, sqft: 8500, description: 'Exclusive waterfront estate with private dock.', mainImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80', images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'], features: ['Waterfront', 'Private Dock'], createdAt: new Date(), agentId: 'demo' } as Property,
    ];
    openExport({
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
    }, reportProperties);
  };

  const greeting = getGreeting(t as any);
  const firstName = getFirstName(user, t.dashboard.there);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl md:text-2xl text-gray-900 dark:text-white">
            {greeting},{' '}
            <span className="font-bold text-accent">{firstName}</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
            {t.dashboard.todayPlanned
              .replace('{viewings}', String(todayViewings.length))
              .replace('{leads}', String(newLeadsCount))}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportReport}
            className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            {t.dashboard.exportReport}
          </button>
          <button
            type="button"
            onClick={onAddProperty}
            className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 btn-outline-accent [&_svg]:text-current"
          >
            <Building2 size={16} />
            {t.dashboard.addProperty}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4 mb-8 pb-8 border-b border-gray-200 dark:border-zinc-800">
        {statsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">{t.dashboard.loadingData}</span>
          </div>
        ) : (
          <>
            <StatItem label={t.dashboard.activeListings} value={String(activeListings)} />
            <StatItem label={t.dashboard.contacts} value={String(contactsCount)} />
            <StatItem label={t.dashboard.portfolioValueActive} value={formatCurrency(portfolioValue, language)} />
            <StatItem label={t.dashboard.activeTasks} value={String(activeDealsCount)} />
            <StatItem label={t.dashboard.newLeads} value={String(newLeadsCount)} />
            <StatItem label={t.dashboard.monthlyRentalIncome ?? 'Monatliche Mieteinnahmen'} value={formatCurrency(monthlyRentalIncome, language)} />
          </>
        )}
      </div>

      {/* Main content: Appointments + Rent Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 glass rounded-xl p-5 flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">{t.dashboard.upcomingAppointments}</h3>
            <p className="text-sm text-gray-400 dark:text-zinc-500">{format(new Date(), 'EEEE, d. MMMM')}</p>
          </div>

          {nextScheduledViewings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon className="text-gray-300 dark:text-zinc-600 mb-2" size={28} />
              <p className="text-sm text-gray-500 dark:text-zinc-500">{t.dashboard.noUpcomingAppointments}</p>
            </div>
          ) : (
            <ul className="flex-1 space-y-1 list-none p-0 m-0">
              {nextScheduledViewings.map((v) => {
                const d = getViewingDate(v);
                const type = (v.eventType ?? 'viewing') as ViewingEventType;
                const label = VIEWING_EVENT_TYPE_LABELS[type] ?? t.dashboard.viewingFallback;
                return (
                  <li
                    key={v.id}
                    className="flex items-baseline gap-3 py-2.5 border-b border-gray-100 dark:border-zinc-800 last:border-0"
                  >
                    <span className="font-medium text-sm text-gray-900 dark:text-zinc-100 shrink-0 w-24">
                      {d ? (isToday(d) ? format(d, 'HH:mm') : format(d, 'd. MMM, HH:mm')) : '—'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-zinc-400">{label}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-accent hover:opacity-80 transition-opacity w-fit"
            >
              {t.dashboard.viewFullCalendar}
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Rent Tracker (merged) */}
        <div className="lg:col-span-1 glass rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {t.dashboard.rentReviewTitle ?? 'Mietprüfung'}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} className="text-gray-500 dark:text-zinc-400" />
              </button>
              <span className="text-xs text-gray-600 dark:text-zinc-400 min-w-[90px] text-center">
                {reviewMonthLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={14} className="text-gray-500 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          {rentalProperties.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Home className="text-gray-300 dark:text-zinc-600 mb-2" size={24} />
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t.dashboard.noRentalProperties ?? 'Keine Mietobjekte vorhanden'}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-2 mt-3 mb-2 px-1">
                <div className="w-9 text-center text-[10px] text-gray-400 dark:text-zinc-600 leading-none">
                  {t.dashboard.reviewedCount ?? 'Gepr.'}
                </div>
                <div className="w-9 text-center text-[10px] text-gray-400 dark:text-zinc-600 leading-none">
                  {t.dashboard.rentPaidCount ?? 'Bez.'}
                </div>
              </div>

              <ul className="space-y-1 list-none p-0 m-0 flex-1">
                {rentalProperties.map((p) => {
                  const isReviewed = reviewedPropertyIds.has(p.id);
                  const isPaid = paidPropertyIds.has(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                      <button
                        type="button"
                        onClick={() => handleToggleReview(p.id)}
                        className="p-0.5 rounded hover:opacity-70 transition-opacity shrink-0"
                        aria-label="Toggle reviewed"
                      >
                        {isReviewed
                          ? <CheckCircle2 size={18} className="text-green-500" />
                          : <Circle size={18} className="text-gray-300 dark:text-zinc-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(p.id)}
                        className="p-0.5 rounded hover:opacity-70 transition-opacity shrink-0"
                        aria-label="Toggle paid"
                      >
                        {isPaid
                          ? <CheckCircle2 size={18} className="text-green-500" />
                          : <Circle size={18} className="text-gray-300 dark:text-zinc-600" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                          {formatCurrency(p.price ?? 0, language)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Progress summary */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between text-xs text-gray-400 dark:text-zinc-600">
                <span>{reviewedPropertyIds.size}/{rentalProperties.length} {t.dashboard.reviewedCount ?? 'geprüft'}</span>
                <span>{paidPropertyIds.size}/{rentalProperties.length} {t.dashboard.rentPaidCount ?? 'bezahlt'}</span>
              </div>
            </>
          )}
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
