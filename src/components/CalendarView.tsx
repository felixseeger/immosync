import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  User,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from 'date-fns';
import { de, enUS, zhCN, ja, fr } from 'date-fns/locale';
import { subscribeToViewings, updateViewing, deleteViewing } from '../services/viewingsService';
import { getProperties } from '../services/propertyService';
import { subscribeToContacts } from '../services/contactsService';
import { logActivity } from '../services/activityService';
import AddViewingModal from './AddViewingModal';
import { sfx } from '../utils/sfx';
import type { Viewing, Property, Contact, ViewingEventType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

function getViewingDate(v: Viewing): Date | null {
  if (!v?.scheduledAt) return null;
  const d = v.scheduledAt?.toDate?.() ?? v.scheduledAt;
  return d instanceof Date ? d : new Date(d);
}

const dateLocaleMap = { de, en: enUS, zh: zhCN, ja, fr } as const;

export default function CalendarView() {
  const { t, language } = useLanguage();
  const dateLocale = dateLocaleMap[language] ?? de;

  function getEventTypeLabel(v: Viewing): string {
    const type = (v.eventType ?? 'viewing') as ViewingEventType;
    return t.viewing[type] ?? t.viewing.viewing;
  }

  function getStatusLabel(status: Viewing['status']): string {
    switch (status) {
      case 'scheduled': return t.viewing.viewingScheduled;
      case 'completed': return t.viewing.viewingCompleted;
      case 'cancelled': return t.viewing.viewingCancelled;
      case 'no_show': return t.viewing.viewingNoShow;
      default: return status ?? '';
    }
  }

  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [detailViewing, setDetailViewing] = useState<Viewing | null>(null);
  const [editViewing, setEditViewing] = useState<Viewing | null>(null);

  useEffect(() => {
    const unsub = subscribeToViewings(setViewings);
    return unsub;
  }, []);
  useEffect(() => {
    getProperties().then(setProperties).catch(() => setProperties([]));
  }, []);
  useEffect(() => {
    const unsub = subscribeToContacts(setContacts);
    return unsub;
  }, []);

  const propertyMap = useMemo(() => {
    const m: Record<string, string> = {};
    properties.forEach((p) => { m[p.id] = p.title ?? p.address ?? p.id; });
    return m;
  }, [properties]);
  const contactMap = useMemo(() => {
    const m: Record<string, string> = {};
    contacts.forEach((c) => { m[c.id] = c.name ?? c.email ?? c.id; });
    return m;
  }, [contacts]);

  const viewingsByDay = useMemo(() => {
    const map = new Map<string, Viewing[]>();
    viewings.forEach((v) => {
      const d = getViewingDate(v);
      if (!d || v.status === 'cancelled') return;
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    map.forEach((arr) => arr.sort((a, b) => (getViewingDate(a)?.getTime() ?? 0) - (getViewingDate(b)?.getTime() ?? 0)));
    return map;
  }, [viewings]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    days.push(d);
    d = addDays(d, 1);
  }
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const openAddModal = (day?: Date) => {
    setInitialDate(day ? format(day, 'yyyy-MM-dd') : undefined);
    setShowAddModal(true);
  };

  const dayViewings = selectedDay ? viewingsByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? [] : [];

  const handleStatusChange = async (viewingId: string, status: Viewing['status']) => {
    try {
      await updateViewing(viewingId, { status });
      const viewing = viewings.find((v) => v.id === viewingId);
      const property = viewing ? properties.find((p) => p.id === viewing.propertyId) : undefined;
      const contact = viewing ? contacts.find((c) => c.id === viewing.contactId) : undefined;
      const detail = [property?.title || property?.address, contact?.name || contact?.email]
        .filter(Boolean)
        .join(' · ');
      const actionKey =
        status === 'completed'
          ? 'viewingMarkedCompleted'
          : status === 'cancelled'
            ? 'viewingCancelled'
            : status === 'no_show'
              ? 'viewingNoShow'
              : 'viewingUpdated';
      await logActivity({
        type: 'task',
        action: t.viewing.activityUpdated,
        details: detail || t.viewing.viewing,
        actionKey,
      });
      setDetailViewing(null);
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-light dark:bg-app-dark">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-app-light/90 dark:bg-app-dark/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.viewing.calendarTitle}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg text-sm btn-outline-accent [&_svg]:text-current"
          >
            <Plus size={18} />
            {t.viewing.newEvent}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-4 md:p-6 gap-6 overflow-hidden">
        {/* Month calendar */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.viewing.today}
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label={t.viewing.prevMonth}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label={t.viewing.nextMonth}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 glass rounded-xl overflow-auto">
            <table className="w-full border-collapse table-fixed" style={{ minHeight: 320 }}>
              <thead>
                <tr>
                  {t.viewing.weekdays.map((wd) => (
                    <th
                      key={wd}
                      className="border-b border-gray-200 dark:border-zinc-800 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider"
                    >
                      {wd}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((day) => {
                      const key = format(day, 'yyyy-MM-dd');
                      const dayItems = viewingsByDay.get(key) ?? [];
                      const isSelected = selectedDay && isSameDay(day, selectedDay);
                      return (
                        <td
                          key={key}
                          className="align-top border-b border-gray-100 dark:border-zinc-800/80 p-1 md:p-2 min-h-[80px] md:min-h-[100px]"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedDay(day)}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedDay(day)}
                            className={`h-full min-h-[72px] md:min-h-[88px] rounded-lg p-1.5 md:p-2 cursor-pointer transition-colors ${
                              !isSameMonth(day, monthStart)
                                ? 'bg-gray-50 dark:bg-zinc-900/50 text-gray-400 dark:text-zinc-600'
                                : isSelected
                                  ? 'bg-accent/20 dark:bg-accent/10 ring-1 ring-accent/50'
                                  : isToday(day)
                                    ? 'bg-accent/5 dark:bg-accent/5 hover:bg-accent/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                            }`}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${
                                isToday(day)
                                  ? 'bg-accent text-white dark:text-black'
                                  : isSameMonth(day, monthStart)
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400 dark:text-zinc-600'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>
                            <div className="mt-1 space-y-0.5">
                              {dayItems.slice(0, 3).map((v) => {
                                const vd = getViewingDate(v);
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailViewing(v);
                                    }}
                                    className="w-full text-left px-1.5 py-0.5 rounded text-[11px] md:text-xs bg-accent/20 dark:bg-accent/10 text-gray-800 dark:text-zinc-200 truncate hover:bg-accent/30 dark:hover:bg-accent/20 border border-transparent hover:border-accent/40"
                                  >
                                    {vd ? format(vd, 'HH:mm') : ''} {propertyMap[v.propertyId] ?? t.property.property}
                                  </button>
                                );
                              })}
                              {dayItems.length > 3 && (
                                <span className="block px-1.5 text-[10px] text-gray-500 dark:text-zinc-500">
                                  {t.viewing.moreCount.replace('{n}', String(dayItems.length - 3))}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel: selected day viewings */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col rounded-xl overflow-hidden glass border border-gray-200/50 dark:border-white/10 shadow-xl shadow-black/5">
          {selectedDay ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {format(selectedDay, 'EEEE, MMM d', { locale: dateLocale })}
                </h3>
                <button
                  type="button"
                  onClick={() => openAddModal(selectedDay)}
                  className="text-sm font-medium text-accent hover:text-accent/90"
                >
                  {t.viewing.add}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {dayViewings.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-zinc-500 py-4 text-center">
                    {t.viewing.noViewingsThisDay}
                  </p>
                ) : (
                  dayViewings.map((v) => {
                    const vd = getViewingDate(v);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setDetailViewing(v)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-accent/50 bg-gray-50/50 dark:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                          <Clock size={14} className="text-gray-500 dark:text-zinc-400 shrink-0" />
                          {vd ? format(vd, 'HH:mm') : '—'}
                          <span className="text-accent font-semibold">{getEventTypeLabel(v)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                          <Building2 size={12} />
                          {propertyMap[v.propertyId] ?? v.propertyId}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                          <User size={12} />
                          {contactMap[v.contactId] ?? v.contactId}
                        </div>
                        {v.status !== 'scheduled' && (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400">
                            {getStatusLabel(v.status)}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-zinc-500">{t.viewing.clickDayToSeeViewings}</p>
            </div>
          )}
        </div>
      </div>

      {/* Viewing detail popover */}
      <AnimatePresence>
        {detailViewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetailViewing(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-app-light dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{detailViewing ? getEventTypeLabel(detailViewing) : t.viewing.event}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.menuSelect();
                      setEditViewing(detailViewing);
                      setDetailViewing(null);
                    }}
                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400"
                    aria-label={t.viewing.editViewing}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailViewing(null)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-500" />
                  {getViewingDate(detailViewing)
                    ? format(getViewingDate(detailViewing)!, 'EEEE, MMM d · HH:mm', { locale: dateLocale })
                    : '—'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={16} className="text-gray-500" />
                  {propertyMap[detailViewing.propertyId] ?? detailViewing.propertyId}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-500" />
                  {contactMap[detailViewing.contactId] ?? detailViewing.contactId}
                </div>
                {detailViewing.note && (
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{detailViewing.note}</p>
                )}
                <div className="pt-2 flex flex-wrap gap-2">
                  {detailViewing.status === 'scheduled' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(detailViewing.id, 'completed')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                      >
                        {t.viewing.markCompleted}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(detailViewing.id, 'cancelled')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30"
                      >
                        {t.viewing.cancelViewing}
                      </button>
                    </>
                  )}
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={async () => {
                      sfx.menuSelect();
                      try {
                        await deleteViewing(detailViewing.id);
                        setDetailViewing(null);
                      } catch {
                        // deletion failed silently — user can retry
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    aria-label={t.viewing.deleteViewing}
                  >
                    <Trash2 size={16} />
                    {t.common.delete}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAddModal && (
        <AddViewingModal
          initialDate={initialDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
      {editViewing && (
        <AddViewingModal
          viewing={editViewing}
          onClose={() => setEditViewing(null)}
          onSuccess={() => setEditViewing(null)}
        />
      )}
    </div>
  );
}
