import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  Search,
} from 'lucide-react';
import { subscribeToContacts, deleteContact, subscribeToPropertyLinksByContact } from '../services/contactsService';
import { getPropertyTitles } from '../services/propertyService';
import type { Contact, ContactCategory, LeadStatus } from '../types';
import ContactSlideOverPanel from './ContactSlideOverPanel';
import AnimatedLink from './AnimatedLink';
import { useLanguage } from '../contexts/LanguageContext';

function formatBudget(sp: Contact['searchProfile']): string {
  if (!sp) return '—';
  const min = sp.minPrice;
  const max = sp.maxPrice;
  if (min == null && max == null) return '—';
  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `≤ ${fmt(max)}`;
  return `≥ ${fmt(min!)}`;
}

interface ContactsProps {
  initialSelectedContactId?: string | null;
  onClearInitialContactSelection?: () => void;
  onSelectProperty?: (propertyId: string) => void;
}

export default function Contacts({
  initialSelectedContactId,
  onClearInitialContactSelection,
  onSelectProperty,
}: ContactsProps = {}) {
  const { t } = useLanguage();
  const CATEGORY_LABELS: Record<ContactCategory, string> = {
    buyer: t.contactRole.buyer,
    tenant: t.contactRole.tenant,
    owner: t.contactRole.owner,
    investor: t.contactRole.investor,
    facility_manager: t.contactRole.facility_manager,
    facility_service: t.contactRole.facility_service,
  };

  const STATUS_LABELS: Record<LeadStatus, string> = {
    new: t.contactStage.new,
    contacted: t.contactStage.contacted,
    qualified: t.contactStage.qualified,
    viewing: t.contactStage.viewing,
    negotiation: t.contactStage.negotiation,
    won: t.contactStage.won,
    lost: t.contactStage.lost,
  };

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | ''>('');
  const [panelContact, setPanelContact] = useState<Contact | null | 'new'>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linksByContact, setLinksByContact] = useState<Record<string, string[]>>({});
  const [propertyTitles, setPropertyTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = subscribeToContacts((data) => {
      setContacts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!initialSelectedContactId || !onClearInitialContactSelection) return;
    const contact = contacts.find((c) => c.id === initialSelectedContactId);
    if (contact) {
      setPanelContact(contact);
      onClearInitialContactSelection();
    }
  }, [contacts, initialSelectedContactId, onClearInitialContactSelection]);

  useEffect(() => {
    const unsub = subscribeToPropertyLinksByContact(setLinksByContact);
    return unsub;
  }, []);

  useEffect(() => {
    const ids = Object.values(linksByContact).flat();
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      setPropertyTitles({});
      return;
    }
    getPropertyTitles(unique).then(setPropertyTitles);
  }, [linksByContact]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const match =
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const handleDelete = async (contact: Contact) => {
    setDeleting(true);
    try {
      await deleteContact(contact.id);
      setDeleteConfirm(null);
    } catch {
      // deletion failed silently — contact remains
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-light dark:bg-app-dark relative">
      <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-zinc-800 bg-app-light/90 dark:bg-app-dark/50 backdrop-blur-md sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t.nav.contacts}
          </h2>
          <button
            onClick={() => setPanelContact('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold btn-outline-accent [&_svg]:text-current shrink-0"
          >
            <Plus size={16} />
            {t.contact.newContact}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.search ?? 'Search…'}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === ''
                  ? 'bg-accent text-white dark:text-black border border-accent'
                  : 'text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              {t.propertyFilter.all}
            </button>
            {(Object.keys(CATEGORY_LABELS) as ContactCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-accent text-white dark:text-black border border-accent'
                    : 'text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <User size={20} className="text-gray-400 dark:text-zinc-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t.contact.noContactsYet}</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-500 mb-4 max-w-sm">
              {search || categoryFilter ? t.contact.noContacts : t.contact.noContactsHint}
            </p>
            {!search && !categoryFilter && (
              <button
                onClick={() => setPanelContact('new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold btn-outline-accent [&_svg]:text-current"
              >
                <Plus size={16} />
                {t.contact.newContact}
              </button>
            )}
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableName}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableContact}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableCategory}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableStatus}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableBudget}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableMinRooms}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">{t.contact.tableProperties}</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300 w-24">{t.contact.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-100 dark:border-zinc-800/80 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                        {c.company && (
                          <div className="text-xs text-gray-500 dark:text-zinc-500">{c.company}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {c.email && (
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                              <Mail size={12} className="text-gray-400 dark:text-zinc-500" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                              <Phone size={12} className="text-gray-400 dark:text-zinc-500" />
                              {c.phone}
                            </span>
                          )}
                          {!c.email && !c.phone && '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.category ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-[#9372c9]/15 text-[#9372c9] border border-[#9372c9]/25">
                            {CATEGORY_LABELS[c.category]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.leadStatus ? (
                          <span className="text-gray-700 dark:text-zinc-300">{STATUS_LABELS[c.leadStatus]}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-400 font-mono text-xs">
                        {formatBudget(c.searchProfile)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-400">
                        {c.searchProfile?.minRooms != null ? c.searchProfile.minRooms : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[220px]">
                        {(linksByContact[c.id] || []).length === 0 ? (
                          <span className="text-gray-500 dark:text-zinc-500">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                            {(linksByContact[c.id] || []).map((propertyId) => (
                              <AnimatedLink
                                key={propertyId}
                                onClick={() => onSelectProperty?.(propertyId)}
                                className="!text-blue-600 dark:!text-blue-400 text-left truncate max-w-[140px] inline-block"
                                title={propertyTitles[propertyId] || propertyId}
                              >
                                {propertyTitles[propertyId] || propertyId}
                              </AnimatedLink>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPanelContact(c)}
                            aria-label={t.contact.editAria}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 dark:hover:bg-blue-500/15 border border-transparent hover:border-blue-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(c)}
                            aria-label={t.contact.deleteAria}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/15 dark:hover:bg-red-500/15 border border-transparent hover:border-red-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {panelContact !== null && (
          <ContactSlideOverPanel
            contact={panelContact === 'new' ? null : panelContact}
            onClose={() => setPanelContact(null)}
            onSuccess={() => setPanelContact(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
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
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
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
    </div>
  );
}
