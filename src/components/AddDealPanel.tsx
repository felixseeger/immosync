import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Loader2, Briefcase } from 'lucide-react';
import { createDeal, DEAL_STAGES, addDealActivity } from '../services/dealsService';
import { sfx } from '../utils/sfx';
import type { DealType, DealStageId } from '../types';
import type { Contact } from '../types';
import type { Property } from '../types';

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';
const selectCls = (hasValue: boolean) =>
  inputCls + (hasValue ? ' text-accent border-accent' : '');

interface AddDealPanelProps {
  onClose: () => void;
  onSuccess: () => void;
  contacts: Contact[];
  properties: Property[];
}

export default function AddDealPanel({ onClose, onSuccess, contacts, properties }: AddDealPanelProps) {
  const [contactId, setContactId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [dealType, setDealType] = useState<DealType>('sale');
  const [stageId, setStageId] = useState<DealStageId>('lead');
  const [financialValue, setFinancialValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  const handleSubmit = async () => {
    const value = Number(financialValue);
    if (!contactId || !propertyId || Number.isNaN(value) || value < 0) {
      setError('Please select contact, property, and enter a valid value.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const id = await createDeal({
        contactId,
        propertyId,
        dealType,
        stageId,
        financialValue: value,
        order: 0,
      });
      await addDealActivity(id, 'note', 'Deal created.');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  const panelContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex justify-end"
      style={{ zIndex: 9999 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-full"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/15 border-2 border-accent/40">
              <Briefcase size={18} className="text-[#D9FF00]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New deal</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-accent/50">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Contact</label>
            <select value={contactId} onChange={(e) => { sfx.menuSelect(); setContactId(e.target.value); }} className={selectCls(!!contactId)} required>
              <option value="">— Select —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Property</label>
            <select value={propertyId} onChange={(e) => { sfx.menuSelect(); setPropertyId(e.target.value); }} className={selectCls(!!propertyId)} required>
              <option value="">— Select —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Type</label>
            <select value={dealType} onChange={(e) => { sfx.menuSelect(); setDealType(e.target.value as DealType); }} className={selectCls(!!dealType)}>
              <option value="sale">Sale</option>
              <option value="rental">Rental</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Stage</label>
            <select value={stageId} onChange={(e) => { sfx.menuSelect(); setStageId(e.target.value as DealStageId); }} className={selectCls(!!stageId)}>
              {DEAL_STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {dealType === 'sale' ? 'Expected commission' : 'Rent (monthly)'}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={financialValue}
              onChange={(e) => setFinancialValue(e.target.value)}
              placeholder="0"
              className={inputCls + (financialValue ? ' text-accent' : '')}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { sfx.menuSelect(); handleSubmit(); }}
              disabled={saving}
              className="flex-1 py-2.5 bg-accent text-white dark:text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              Create deal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(panelContent, document.body);
}
