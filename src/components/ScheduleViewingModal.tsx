import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, User, Loader2 } from 'lucide-react';
import { createViewing } from '../services/viewingsService';
import { subscribeToContacts } from '../services/contactsService';
import type { Property } from '../types';
import type { Contact } from '../types';
import { Timestamp } from 'firebase/firestore';
import { format, setHours, setMinutes } from 'date-fns';

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neon-yellow';

interface ScheduleViewingModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleViewingModal({ property, onClose, onSuccess }: ScheduleViewingModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToContacts(setContacts);
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim() || !date.trim() || !time.trim()) {
      setError('Please select a contact, date, and time.');
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
      await createViewing({
        propertyId: property.id,
        contactId,
        scheduledAt: Timestamp.fromDate(scheduled),
        status: 'scheduled',
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule viewing');
    } finally {
      setSaving(false);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
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
      onClick={onClose}
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
            <Calendar size={20} className="text-neon-yellow" />
            Schedule viewing
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
            {property.title}
          </p>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Interested contact
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className={inputCls + ' pl-9'}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Time
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputCls}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-neon-yellow text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
