import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  ChevronDown,
  X,
} from 'lucide-react';
import { subscribeToContacts, deleteContact, subscribeToPropertyLinksByContact } from '../services/contactsService';
import { getPropertyTitles } from '../services/propertyService';
import type { Contact, ContactCategory, LeadStatus } from '../types';
import ContactSlideOverPanel from './ContactSlideOverPanel';

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  buyer: 'Buyer',
  tenant: 'Tenant',
  owner: 'Owner',
  investor: 'Investor',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing: 'Viewing',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

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

function formatAssignedProperties(titles: string[]): string {
  if (!titles?.length) return '—';
  return titles.length > 2 ? `${titles.slice(0, 2).join(', ')} +${titles.length - 2}` : titles.join(', ');
}

interface ContactsProps {
  initialSelectedContactId?: string | null;
  onClearInitialContactSelection?: () => void;
}

export default function Contacts({
  initialSelectedContactId,
  onClearInitialContactSelection,
}: ContactsProps = {}) {
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
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black relative">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white/90 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Contacts
          </h2>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-neon-yellow w-64"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === ''
                  ? 'bg-neon-yellow text-black'
                  : 'text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_LABELS) as ContactCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-neon-yellow text-black'
                    : 'text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setPanelContact('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-neon-yellow text-black font-bold rounded-lg text-sm hover:bg-neon-yellow/90 transition-colors"
        >
          <Plus size={18} />
          Add contact
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-neon-yellow" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-900 flex items-center justify-center mb-4">
              <User size={28} className="text-gray-500 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No contacts yet</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-500 mb-4 max-w-sm">
              {search || categoryFilter ? 'No contacts match your filters.' : 'Add your first contact to start managing leads and matching them to properties.'}
            </p>
            {!search && !categoryFilter && (
              <button
                onClick={() => setPanelContact('new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neon-yellow text-black font-bold rounded-lg text-sm"
              >
                <Plus size={18} />
                Add contact
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Contact</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Category</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Budget</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Min rooms</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Properties</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300 w-24">Actions</th>
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
                          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/25">
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
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-500 text-xs max-w-[180px] truncate" title={(linksByContact[c.id] || []).map((id) => propertyTitles[id] || id).join(', ')}>
                        {formatAssignedProperties((linksByContact[c.id] || []).map((id) => propertyTitles[id] || id))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPanelContact(c)}
                            className="p-2 rounded-lg text-gray-500 dark:text-zinc-500 hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(c)}
                            className="p-2 rounded-lg text-gray-500 dark:text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
              className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete contact?</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                Permanently remove <strong>{deleteConfirm.name}</strong>? Property links will also be removed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
