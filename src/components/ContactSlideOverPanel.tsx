import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Trash2, Building2, Unlink } from 'lucide-react';
import { createContact, updateContact, deleteContact, getLinkedPropertyIdsForContact, linkContactToProperty, unlinkContactFromProperty } from '../services/contactsService';
import { getProperties } from '../services/propertyService';
import { sfx } from '../utils/sfx';
import { useLanguage } from '../contexts/LanguageContext';
import type { Contact, ContactCategory, LeadStatus, Property } from '../types';

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';
const selectCls = (hasValue: boolean) =>
  inputCls + (hasValue ? ' text-accent border-accent' : '');

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
    {children}
    {required && <span className="text-accent ml-1">*</span>}
  </label>
);

const CATEGORIES: ContactCategory[] = ['buyer', 'tenant', 'owner', 'investor', 'facility_manager', 'facility_service'];
const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'viewing', 'negotiation', 'won', 'lost'];

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  category: ContactCategory | '';
  leadStatus: LeadStatus | '';
  notes: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  category: '',
  leadStatus: '',
  notes: '',
};

interface ContactSlideOverPanelProps {
  contact: Contact | null;
  onClose: () => void;
  onSuccess: () => void;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export default function ContactSlideOverPanel({ contact, onClose, onSuccess }: ContactSlideOverPanelProps) {
  const { t } = useLanguage();
  const isEditing = Boolean(contact);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedPropertyIds, setLinkedPropertyIds] = useState<string[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [assignPropertyId, setAssignPropertyId] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      getLinkedPropertyIdsForContact(contact.id).then(setLinkedPropertyIds);
    } else {
      setLinkedPropertyIds([]);
    }
  }, [contact?.id]);

  useEffect(() => {
    getProperties().then(setAllProperties);
  }, []);

  const handleLinkProperty = async () => {
    if (!contact || !assignPropertyId) return;
    setLinking(true);
    try {
      await linkContactToProperty(assignPropertyId, contact.id);
      setLinkedPropertyIds((prev) => (prev.includes(assignPropertyId) ? prev : [...prev, assignPropertyId]));
      setAssignPropertyId('');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProperty = async (propertyId: string) => {
    if (!contact) return;
    setUnlinkingId(propertyId);
    try {
      await unlinkContactFromProperty(propertyId, contact.id);
      setLinkedPropertyIds((prev) => prev.filter((id) => id !== propertyId));
    } finally {
      setUnlinkingId(null);
    }
  };

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        category: contact.category ?? '',
        leadStatus: contact.leadStatus ?? '',
        notes: contact.notes ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [contact]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (['category', 'leadStatus', 'marketingType'].includes(key)) sfx.menuSelect();
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const payload = stripUndefined({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        category: form.category || undefined,
        leadStatus: form.leadStatus || undefined,
        notes: form.notes.trim() || undefined,
      });
      if (isEditing && contact) {
        await updateContact(contact.id, payload);
      } else {
        await createContact(payload as Parameters<typeof createContact>[0]);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.contact.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    setDeleting(true);
    try {
      await deleteContact(contact.id);
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch {
      // deletion failed silently — contact remains
    } finally {
      setDeleting(false);
    }
  };

  const panelContent = (
    <AnimatePresence>
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
          className="relative w-full max-w-lg bg-app-light dark:bg-app-dark rounded-none rounded-l-2xl border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-full"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-panel-title"
        >
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h2 id="contact-panel-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? t.contact.editContact : t.contact.newContact}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={t.common.close}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5" noValidate>
            <div>
              <Label required>{t.contact.name}</Label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder={t.contact.namePlaceholder}
                className={inputCls}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.contact.email}</Label>
                <input type="email" value={form.email} onChange={set('email')} placeholder={t.contact.emailPlaceholder} className={inputCls} />
              </div>
              <div>
                <Label>{t.contact.phone}</Label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder={t.contact.phonePlaceholder} className={inputCls} />
              </div>
            </div>
            <div>
              <Label>{t.contact.company}</Label>
              <input type="text" value={form.company} onChange={set('company')} placeholder={t.contact.companyPlaceholder} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.contact.category}</Label>
                <select value={form.category} onChange={set('category')} className={selectCls(!!form.category)}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t.contactRole[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t.contact.leadStatus}</Label>
                <select value={form.leadStatus} onChange={set('leadStatus')} className={selectCls(!!form.leadStatus)}>
                  <option value="">—</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{t.contactStage[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>{t.contact.notes}</Label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={2}
                placeholder={t.contact.notesPlaceholder}
                className={inputCls}
              />
            </div>

            {isEditing && contact && (
              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 size={14} />
                  {t.contact.assignedProperties}
                </p>
                <div className="space-y-2">
                  {linkedPropertyIds.length > 0 && (
                    <ul className="space-y-1.5">
                      {linkedPropertyIds.map((pid) => {
                        const prop = allProperties.find((p) => p.id === pid);
                        const title = prop?.title ?? pid;
                        return (
                          <li key={pid} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                            <span className="text-sm text-gray-900 dark:text-white truncate">{title}</span>
                            <button
                              type="button"
                              onClick={() => handleUnlinkProperty(pid)}
                              disabled={unlinkingId === pid}
                              aria-label={t.contact.unlink}
                              className="p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              {unlinkingId === pid ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Unlink size={14} aria-hidden="true" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={assignPropertyId}
                      onChange={(e) => { sfx.menuSelect(); setAssignPropertyId(e.target.value); }}
                      className={(assignPropertyId ? ' text-accent border-accent ' : ' ') + inputCls + ' flex-1'}
                    >
                      <option value="">{t.contact.assignToProperty}</option>
                      {allProperties
                        .filter((p) => !linkedPropertyIds.includes(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { sfx.menuSelect(); handleLinkProperty(); }}
                      disabled={!assignPropertyId || linking}
                      className="px-4 py-2.5 font-semibold rounded-lg text-sm btn-outline-accent disabled:opacity-50 flex items-center gap-1.5 [&_svg]:text-current"
                    >
                      {linking ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                      {t.contact.add}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-4">
              <button
                type="button"
                disabled={saving || !form.name.trim()}
                onClick={() => { sfx.menuSelect(); handleSubmit(); }}
                className="w-full py-3 bg-accent text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {isEditing ? t.common.saveChanges : t.contact.createContact}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(true); }}
                  className="w-full py-2.5 border border-red-500/50 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  {t.contact.deleteContact}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-app-light dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.contact.deleteContactConfirmTitle}</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                {t.contact.deleteContactConfirmDesc}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(false); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); handleDelete(); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {t.common.delete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
