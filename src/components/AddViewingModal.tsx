import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format, setHours, setMinutes } from 'date-fns';
import { createViewing, updateViewing } from '../services/viewingsService';
import { subscribeToContacts } from '../services/contactsService';
import { getProperties } from '../services/propertyService';
import { sfx } from '../utils/sfx';
import type { Property, Contact, Viewing, ViewingEventType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const EVENT_TYPES: ViewingEventType[] = ['viewing', 'signing', 'payment', 'negotiation', 'notar'];

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';
const selectCls = (hasValue: boolean) =>
  inputCls + (hasValue ? ' text-accent border-accent' : '');

function getViewingDate(v: Viewing): Date | null {
  if (!v?.scheduledAt) return null;
  const t = v.scheduledAt?.toDate?.() ?? v.scheduledAt;
  return t instanceof Date ? t : new Date(t);
}

interface AddViewingModalProps {
  /** Optional initial date (yyyy-MM-dd) when opening from a specific day */
  initialDate?: string;
  /** When set, modal opens in edit mode with form prefilled */
  viewing?: Viewing | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddViewingModal({ initialDate, viewing, onClose, onSuccess }: AddViewingModalProps) {
  const { t } = useLanguage();
  const isEdit = !!viewing;
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [eventType, setEventType] = useState<ViewingEventType>('viewing');
  const [date, setDate] = useState(initialDate ?? '');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProperties().then(setProperties).catch(() => setProperties([]));
  }, []);
  useEffect(() => {
    const unsub = subscribeToContacts(setContacts);
    return unsub;
  }, []);
  useEffect(() => {
    if (initialDate && !viewing) setDate(initialDate);
  }, [initialDate, viewing]);
  useEffect(() => {
    if (viewing) {
      setPropertyId(viewing.propertyId ?? '');
      setContactId(viewing.contactId ?? '');
      setEventType((viewing.eventType as ViewingEventType) ?? 'viewing');
      setNote(viewing.note ?? '');
      const d = getViewingDate(viewing);
      if (d) {
        setDate(format(d, 'yyyy-MM-dd'));
        setTime(format(d, 'HH:mm'));
      }
    }
  }, [viewing]);

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId.trim() || !contactId.trim() || !date.trim() || !time.trim()) {
      setError(t.viewing.selectPropertyContactDateTime);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const d = new Date(date);
      const scheduled = setMinutes(setHours(d, hours), minutes ?? 0);
      if (isNaN(scheduled.getTime())) {
        setError(t.viewing.invalidDateTime);
        setSaving(false);
        return;
      }
      const payload = {
        propertyId,
        contactId,
        eventType,
        scheduledAt: Timestamp.fromDate(scheduled),
        note: note.trim() || undefined,
      };
      if (isEdit && viewing?.id) {
        await updateViewing(viewing.id, payload);
      } else {
        const property = properties.find((p) => p.id === propertyId);
        const contact = contacts.find((c) => c.id === contactId);
        const activityDetail = [property?.title || property?.address, contact?.name || contact?.email]
          .filter(Boolean)
          .join(' with ');
        await createViewing(
          { ...payload, status: 'scheduled' },
          activityDetail || undefined
        );
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t.viewing.updateFailed : t.viewing.scheduleFailed));
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const timeOptions: string[] = [];
  for (let h = 8; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-app-light dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t.viewing.newViewing}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.common.close}
            className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.property.property}
            </label>
            <select
              value={propertyId}
              onChange={(e) => { sfx.menuSelect(); setPropertyId(e.target.value); }}
              className={selectCls(!!propertyId)}
              required
            >
              <option value="">{t.viewing.selectProperty}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.contact.label}
            </label>
            <select
              value={contactId}
              onChange={(e) => { sfx.menuSelect(); setContactId(e.target.value); }}
              className={selectCls(!!contactId)}
              required
            >
              <option value="">{t.viewing.selectContact}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.email ? ` (${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.viewing.typeOfEvent}
            </label>
            <select
              value={eventType}
              onChange={(e) => { sfx.menuSelect(); setEventType(e.target.value as ViewingEventType); }}
              className={selectCls(true)}
            >
              {EVENT_TYPES.map((value) => (
                <option key={value} value={value}>{t.viewing[value]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                {t.viewing.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => { sfx.menuSelect(); setDate(e.target.value); }}
                min={isEdit ? undefined : today}
                className={inputCls + (date ? ' text-accent' : '')}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                {t.viewing.time}
              </label>
              <select
                value={time}
                onChange={(e) => { sfx.menuSelect(); setTime(e.target.value); }}
                className={selectCls(!!time)}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.viewing.noteOptional}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t.viewing.notePlaceholder}
              className={inputCls}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => sfx.menuSelect()}
              className="flex-1 py-2.5 bg-accent text-white dark:text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
              {saving ? t.viewing.saving : isEdit ? t.viewing.update : t.viewing.schedule}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
