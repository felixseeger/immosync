import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, User, Building2, Loader2 } from 'lucide-react';
import { createViewing } from '../services/viewingsService';
import { subscribeToContacts } from '../services/contactsService';
import { getProperties } from '../services/propertyService';
import type { Property, Contact, ViewingEventType } from '../types';

const EVENT_TYPES: { value: ViewingEventType; label: string }[] = [
  { value: 'viewing', label: 'Viewing' },
  { value: 'signing', label: 'Signing' },
  { value: 'payment', label: 'Payment' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'notar', label: 'Notar' },
];
import { Timestamp } from 'firebase/firestore';
import { setHours, setMinutes } from 'date-fns';
import { sfx } from '../utils/sfx';

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#D9FF00] focus:ring-2 focus:ring-[#D9FF00]/30 transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';
const selectCls = (hasValue: boolean) =>
  inputCls + (hasValue ? ' text-[#D9FF00] border-[#D9FF00]' : '');

interface AddViewingModalProps {
  /** Optional initial date (yyyy-MM-dd) when opening from a specific day */
  initialDate?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddViewingModal({ initialDate, onClose, onSuccess }: AddViewingModalProps) {
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
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

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
      setError('Please select a property, contact, date, and time.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const d = new Date(date);
      const scheduled = setMinutes(setHours(d, hours), minutes ?? 0);
      if (isNaN(scheduled.getTime())) {
        setError('Invalid date or time.');
        setSaving(false);
        return;
      }
      const property = properties.find((p) => p.id === propertyId);
      const contact = contacts.find((c) => c.id === contactId);
      const activityDetail = [property?.title || property?.address, contact?.name || contact?.email]
        .filter(Boolean)
        .join(' with ');
      await createViewing(
        {
          propertyId,
          contactId,
          eventType,
          scheduledAt: Timestamp.fromDate(scheduled),
          status: 'scheduled',
          note: note.trim() || undefined,
        },
        activityDetail || undefined
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule viewing');
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
        className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#D9FF00]/15 border-2 border-[#D9FF00]/40">
              <Calendar size={18} className="text-[#D9FF00]" />
            </span>
            New viewing
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Property
            </label>
            <div className="relative">
              <Building2
                size={16}
                className={
                  'absolute left-3 top-1/2 -translate-y-1/2 transition-colors ' +
                  (propertyId ? 'text-[#D9FF00]' : 'text-gray-400 dark:text-zinc-500')
                }
              />
              <select
                value={propertyId}
                onChange={(e) => { sfx.menuSelect(); setPropertyId(e.target.value); }}
                className={selectCls(!!propertyId) + ' pl-9'}
                required
              >
                <option value="">— Select property —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Contact
            </label>
            <div className="relative">
              <User
                size={16}
                className={
                  'absolute left-3 top-1/2 -translate-y-1/2 transition-colors ' +
                  (contactId ? 'text-[#D9FF00]' : 'text-gray-400 dark:text-zinc-500')
                }
              />
              <select
                value={contactId}
                onChange={(e) => { sfx.menuSelect(); setContactId(e.target.value); }}
                className={selectCls(!!contactId) + ' pl-9'}
                required
              >
                <option value="">— Select contact —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.email ? ` (${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Type of event
            </label>
            <select
              value={eventType}
              onChange={(e) => { sfx.menuSelect(); setEventType(e.target.value as ViewingEventType); }}
              className={selectCls(true)}
            >
              {EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => { sfx.menuSelect(); setDate(e.target.value); }}
                min={today}
                className={inputCls + (date ? ' text-[#D9FF00]' : '')}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Time
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
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. First viewing, bring keys"
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
              className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm hover:border-[#D9FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => sfx.menuSelect()}
              className="flex-1 py-2.5 bg-[#D9FF00] text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#D9FF00] focus:ring-offset-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
              {saving ? 'Saving…' : 'Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
