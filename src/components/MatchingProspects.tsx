import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Mail, CheckCircle, Loader2, Zap, Search, ChevronRight, Link2, Unlink, UserPlus, X } from 'lucide-react';
import {
  subscribeToMatchingContacts,
  subscribeToLinkedContactIds,
  getContactById,
  linkContactToProperty,
  unlinkContactFromProperty,
  getContacts,
  seedDemoContacts,
} from '../services/contactsService';
import type { Property, Contact } from '../types';

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
    v >= 1_000_000 ? `€${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M` : `€${(v / 1000).toFixed(0)}K`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `up to ${fmt(max)}`;
  return `from ${fmt(min!)}`;
}

type ProspectSource = 'linked' | 'matched';

function ContactCard({
  contact,
  source,
  propertyId,
  onUnlink,
}: {
  contact: Contact;
  source: ProspectSource;
  propertyId: string;
  onUnlink: () => void;
}) {
  const [dealSent, setDealSent] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const openDeal = () => {
    setDealSent(true);
    setTimeout(() => setDealSent(false), 2200);
  };

  const message = () => {
    if (contact.email) window.open(`mailto:${contact.email}?subject=Property%20Match`, '_blank');
  };

  const budget = formatBudget(contact.searchProfile);
  const rooms = contact.searchProfile?.minRooms;

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkContactFromProperty(propertyId, contact.id);
      onUnlink();
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white select-none ${avatarColor(contact.name)}`}
        >
          {getInitials(contact.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                source === 'linked'
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}
            >
              {source === 'linked' ? 'Linked' : 'Matched'}
            </span>
            {contact.searchProfile?.marketingType && (
              <span className="text-[10px] text-zinc-500 uppercase">{contact.searchProfile.marketingType}</span>
            )}
          </div>
          {contact.company && <p className="text-xs text-zinc-500 mt-0.5 truncate">{contact.company}</p>}
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
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
        <button
          onClick={openDeal}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            dealSent
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 hover:border-accent/50'
          }`}
        >
          <AnimatePresence mode="wait">
            {dealSent ? (
              <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <CheckCircle size={13} /> Deal opened!
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Zap size={13} /> Open Deal
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={message}
          disabled={!contact.email}
          className="flex items-center justify-center gap-1.5 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Mail size={13} /> Message
        </button>
        {source === 'linked' && (
          <button
            onClick={handleUnlink}
            disabled={unlinking}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-medium rounded-lg transition-colors border border-zinc-700 hover:border-red-500/30 disabled:opacity-50"
            title="Unlink from property"
          >
            {unlinking ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function MatchingProspects({ property }: { property: Property }) {
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  const [linkedContactIds, setLinkedContactIds] = useState<string[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [justSeeded, setJustSeeded] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [linkPickerLoading, setLinkPickerLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubMatch = subscribeToMatchingContacts(
      {
        price: property.price,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        marketingType: property.marketingType,
        city: property.city,
        address: property.address,
        state: property.state,
        country: property.country,
      },
      (matched) => {
        setMatchedContacts(matched);
        setLoading(false);
      }
    );
    return unsubMatch;
  }, [property.id, property.price, property.rooms, property.bedrooms, property.marketingType, property.city, property.address, property.state, property.country]);

  useEffect(() => {
    const unsubLink = subscribeToLinkedContactIds(property.id, setLinkedContactIds);
    return unsubLink;
  }, [property.id]);

  useEffect(() => {
    if (linkedContactIds.length === 0) {
      setLinkedContacts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const list = await Promise.all(linkedContactIds.map((id) => getContactById(id)));
      if (!cancelled) setLinkedContacts(list.filter((c): c is Contact => c != null));
    })();
    return () => { cancelled = true; };
  }, [linkedContactIds.join(',')]);

  const mergedProspects = useMemo(() => {
    const linkedSet = new Set(linkedContactIds);
    const byId = new Map<string, { contact: Contact; source: ProspectSource }>();
    linkedContacts.forEach((c) => byId.set(c.id, { contact: c, source: 'linked' }));
    matchedContacts.forEach((c) => {
      if (!byId.has(c.id)) byId.set(c.id, { contact: c, source: 'matched' });
    });
    const linkedFirst = linkedContacts.map((c) => ({ contact: c, source: 'linked' as const }));
    const matchedOnly = matchedContacts.filter((c) => !linkedSet.has(c.id)).map((c) => ({ contact: c, source: 'matched' as const }));
    return [...linkedFirst, ...matchedOnly];
  }, [linkedContacts, matchedContacts, linkedContactIds]);

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

  const openLinkPicker = async () => {
    setShowLinkPicker(true);
    setLinkPickerLoading(true);
    try {
      const list = await getContacts();
      setAllContacts(list.filter((c) => !linkedContactIds.includes(c.id)));
    } finally {
      setLinkPickerLoading(false);
    }
  };

  const handleLinkContact = async (contactId: string) => {
    setLinkingId(contactId);
    try {
      await linkContactToProperty(property.id, contactId);
      setAllContacts((prev) => prev.filter((c) => c.id !== contactId));
      setShowLinkPicker(false);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
          <Users size={16} className="text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Prospects</h3>
          <p className="text-[11px] text-zinc-500">
            Matched by criteria + manually linked contacts
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!loading && mergedProspects.length > 0 && (
            <span className="bg-accent/10 border border-accent/25 text-accent text-xs font-bold px-2.5 py-0.5 rounded-full">
              {mergedProspects.length}
            </span>
          )}
          <button
            type="button"
            onClick={openLinkPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-accent/30 text-zinc-300 hover:text-accent text-xs font-medium rounded-lg transition-colors"
          >
            <Link2 size={14} />
            Link contact
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-zinc-500 font-mono">live</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-600">
          <Loader2 className="animate-spin mr-2" size={18} />
          <span className="text-sm">Searching contacts…</span>
        </div>
      ) : mergedProspects.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">No prospects yet</p>
          <p className="text-xs text-zinc-600 mb-5 max-w-xs mx-auto">
            No contacts match this property, and none are linked. Add search criteria to contacts or link one manually.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={openLinkPicker}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/15 border border-accent/25 text-accent text-xs font-semibold rounded-lg hover:bg-accent/25 transition-colors"
            >
              <UserPlus size={14} />
              Link a contact
            </button>
            {!justSeeded && (
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {seeding ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                Load demo contacts
              </button>
            )}
          </div>
          <AnimatePresence>
            {justSeeded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-sm font-semibold mt-3 flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} />
                Demo contacts added!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          {mergedProspects.map(({ contact, source }) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              source={source}
              propertyId={property.id}
              onUnlink={() => {}}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showLinkPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLinkPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Link contact to property</h3>
                <button
                  type="button"
                  onClick={() => setShowLinkPicker(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
                >
                  <span className="sr-only">Close</span>
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {linkPickerLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-accent" />
                  </div>
                ) : allContacts.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6">
                    No other contacts to link, or all are already linked.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {allContacts.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => handleLinkContact(c.id)}
                          disabled={linkingId === c.id}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-accent/30 text-left transition-colors disabled:opacity-50"
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(c.name)}`}>
                            {getInitials(c.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{c.name}</p>
                            {c.email && <p className="text-xs text-zinc-500 truncate">{c.email}</p>}
                          </div>
                          {linkingId === c.id ? (
                            <Loader2 size={18} className="animate-spin text-accent shrink-0" />
                          ) : (
                            <Link2 size={16} className="text-accent shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
