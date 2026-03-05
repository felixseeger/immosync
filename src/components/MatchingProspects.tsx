import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Mail, CheckCircle, Loader2, Zap, Search, ChevronRight } from 'lucide-react';
import { subscribeToMatchingContacts, seedDemoContacts } from '../services/contactsService';
import type { Property, Contact } from '../types';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-pink-500',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatBudget(sp: Contact['searchProfile']): string | null {
  if (!sp) return null;
  const min = sp.minPrice;
  const max = sp.maxPrice;
  if (min == null && max == null) return null;
  const fmt = (v: number) =>
    v >= 1_000_000
      ? `€${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
      : `€${(v / 1000).toFixed(0)}K`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `up to ${fmt(max)}`;
  return `from ${fmt(min!)}`;
}

/* ─── Contact Card ──────────────────────────────────────────────────────────── */

function ContactCard({ contact }: { contact: Contact }) {
  const [dealSent, setDealSent] = useState(false);

  const openDeal = () => {
    setDealSent(true);
    setTimeout(() => setDealSent(false), 2200);
  };

  const message = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}?subject=Property%20Match`, '_blank');
    }
  };

  const budget = formatBudget(contact.searchProfile);
  const rooms = contact.searchProfile?.minRooms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white select-none ${avatarColor(
            contact.name
          )}`}
        >
          {getInitials(contact.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
            {contact.searchProfile?.marketingType && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  contact.searchProfile.marketingType === 'Sale'
                    ? 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/20'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                }`}
              >
                {contact.searchProfile.marketingType}
              </span>
            )}
          </div>

          {contact.company && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{contact.company}</p>
          )}

          {/* Criteria badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {budget && (
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                {budget}
              </span>
            )}
            {rooms != null && (
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                {rooms}+ rooms
              </span>
            )}
            {contact.searchProfile?.propertyType && (
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                {contact.searchProfile.propertyType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
        <button
          onClick={openDeal}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            dealSent
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-neon-yellow/10 hover:bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/25 hover:border-neon-yellow/50'
          }`}
        >
          <AnimatePresence mode="wait">
            {dealSent ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle size={13} />
                Deal opened!
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <Zap size={13} />
                Open Deal
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={message}
          disabled={!contact.email}
          className="flex items-center justify-center gap-1.5 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors border border-zinc-700 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Mail size={13} />
          Message
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function MatchingProspects({ property }: { property: Property }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [justSeeded, setJustSeeded] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMatchingContacts(
      {
        price: property.price,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        marketingType: property.marketingType,
      },
      (matched) => {
        setContacts(matched);
        setLoading(false);
      }
    );
    return unsub;
  }, [property.id, property.price, property.rooms, property.bedrooms, property.marketingType]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemoContacts();
      setJustSeeded(true);
      setTimeout(() => setJustSeeded(false), 3000);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-neon-yellow/10 border border-neon-yellow/20">
          <Users size={16} className="text-neon-yellow" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Matching Prospects</h3>
          <p className="text-[11px] text-zinc-500">
            Real-time matches based on price &amp; room criteria
          </p>
        </div>

        {/* Live indicator + count */}
        <div className="ml-auto flex items-center gap-2">
          {!loading && contacts.length > 0 && (
            <span className="bg-neon-yellow/10 border border-neon-yellow/25 text-neon-yellow text-xs font-bold px-2.5 py-0.5 rounded-full">
              {contacts.length}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-zinc-500 font-mono">live</span>
          </div>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-600">
          <Loader2 className="animate-spin mr-2" size={18} />
          <span className="text-sm">Searching contacts…</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">No matching prospects</p>
          <p className="text-xs text-zinc-600 mb-5 max-w-xs mx-auto">
            No contacts in the database match this property's price range and room count criteria.
          </p>

          <AnimatePresence mode="wait">
            {justSeeded ? (
              <motion.p
                key="seeded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} />
                6 demo contacts added!
              </motion.p>
            ) : (
              <motion.button
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSeedDemo}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <Loader2 className="animate-spin" size={13} />
                    Seeding contacts…
                  </>
                ) : (
                  <>
                    <ChevronRight size={13} />
                    Load demo contacts
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      )}
    </section>
  );
}
