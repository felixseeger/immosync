import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Loader2, Search, ChevronRight, Link2, Unlink, UserPlus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
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

function ContactRow({
  contact,
  source,
  propertyId,
  onUnlink,
  onExclude,
}: {
  contact: Contact;
  source: ProspectSource;
  propertyId: string;
  onUnlink: () => void;
  onExclude: () => void;
}) {
  const { t } = useLanguage();
  const [unlinking, setUnlinking] = useState(false);

  const budget = formatBudget(contact.searchProfile);
  const rooms = contact.searchProfile?.minRooms;

  const categoryLabel = contact.category ? (t.contactRole as any)[contact.category] || contact.category : null;

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white select-none ${avatarColor(contact.name)}`}>
        {getInitials(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
            source === 'linked'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
          }`}>
            {source === 'linked' ? (categoryLabel || 'Linked') : 'Matched'}
          </span>
        </div>
        {contact.company && <p className="text-xs text-zinc-500 truncate">{contact.company}</p>}
      </div>
      {source === 'linked' ? (
        <button
          onClick={handleUnlink}
          disabled={unlinking}
          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded disabled:opacity-50 shrink-0"
          title="Unlink"
          aria-label="Unlink contact from property"
        >
          {unlinking ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
        </button>
      ) : (
        <button
          onClick={onExclude}
          className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded shrink-0"
          title="Exclude match"
          aria-label="Exclude matched contact"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

export default function MatchingProspects({ property }: { property: Property }) {
  const { t } = useLanguage();
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  const [linkedContactIds, setLinkedContactIds] = useState<string[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [excludedContactIds, setExcludedContactIds] = useState<Set<string>>(new Set());
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
    const linkedFirst = linkedContacts.map((c) => ({ contact: c, source: 'linked' as const }));
    const matchedOnly = matchedContacts
      .filter((c) => !linkedSet.has(c.id) && !excludedContactIds.has(c.id))
      .map((c) => ({ contact: c, source: 'matched' as const }));
    return [...linkedFirst, ...matchedOnly];
  }, [linkedContacts, matchedContacts, linkedContactIds, excludedContactIds]);

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
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{t.propertyDetail.matchingProspects ?? 'Contacts'}</h3>
        <button
          type="button"
          onClick={openLinkPicker}
          className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition-opacity font-medium"
        >
          <UserPlus size={13} />
          {t.propertyDetail.linkAContact}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 py-6">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">{t.propertyDetail.searchingContacts}</span>
        </div>
      ) : mergedProspects.length === 0 ? (
        <div className="py-6 text-center">
          <Search size={18} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 mb-3">No contacts linked or matched yet.</p>
          <div className="flex items-center justify-center gap-2">
            {!justSeeded && (
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-xs rounded-lg disabled:opacity-50 transition-colors"
              >
                {seeding ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                {t.propertyDetail.loadDemoContacts}
              </button>
            )}
            <AnimatePresence>
              {justSeeded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-400 text-xs flex items-center gap-1"
                >
                  <CheckCircle size={13} /> Demo contacts added!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div>
          {mergedProspects.map(({ contact, source }) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              source={source}
              propertyId={property.id}
              onUnlink={() => {}}
              onExclude={() => setExcludedContactIds(prev => {
                const next = new Set(prev);
                next.add(contact.id);
                return next;
              })}
            />
          ))}
        </div>
      )}

      {/* Link picker modal */}
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
                <h3 className="font-bold text-white">{t.propertyDetail.linkContactToProperty}</h3>
                <button
                  type="button"
                  onClick={() => setShowLinkPicker(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
                  aria-label="Close"
                >
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
                    {t.propertyDetail.noOtherContactsToLink}
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
