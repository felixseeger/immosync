import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, User, Loader2, Briefcase, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchFirestoreGrouped, type SearchResultsByCategory, type SearchResultItem } from '../services/searchService';

const DEBOUNCE_MS = 300;

interface GlobalSearchBarProps {
  onSelectProperty: (propertyId: string) => void;
  onSelectContact: (contactId: string) => void;
  onSelectDeal?: (dealId: string) => void;
  onSelectViewing?: (viewingId: string) => void;
  placeholder?: string;
}

export default function GlobalSearchBar({
  onSelectProperty,
  onSelectContact,
  onSelectDeal,
  onSelectViewing,
  placeholder = 'Search contacts, properties, deals, calendar, or property facts (street, city, bathrooms)…',
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultsByCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setOpen(!!query.trim());
      return;
    }
    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const grouped = await searchFirestoreGrouped(query);
        setResults(grouped);
      } catch (e) {
        setResults(null);
      } finally {
        setLoading(false);
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    if (item.type === 'property') onSelectProperty(item.id);
    else if (item.type === 'contact') onSelectContact(item.id);
    else if (item.type === 'deal' && onSelectDeal) onSelectDeal(item.id);
    else if (item.type === 'calendar' && onSelectViewing) onSelectViewing(item.id);
    setQuery('');
    setResults(null);
    setOpen(false);
  };

  const hasAnyResults =
    results &&
    (results.contacts.length > 0 ||
      results.properties.length > 0 ||
      results.deals.length > 0 ||
      results.calendar.length > 0);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: SearchResultItem[],
    emptyLabel: string
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
        <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider bg-gray-50 dark:bg-zinc-900/80 sticky top-0">
          {icon}
          {title}
        </div>
        <ul className="py-1">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                  {item.matchLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:border-neon-yellow transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neon-yellow" size={18} />
        )}
      </div>

      <AnimatePresence>
        {open && (query.length >= 2 || hasAnyResults) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            {loading && !results ? (
              <div className="p-4 flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-500 text-sm">
                <Loader2 size={18} className="animate-spin" />
                Searching…
              </div>
            ) : !hasAnyResults ? (
              <div className="p-4 text-gray-500 dark:text-zinc-500 text-sm text-center">
                No contacts, properties, deals or calendar entries match.
              </div>
            ) : results ? (
              <>
                {renderSection(
                  'Contacts',
                  <User size={14} className="text-blue-500 shrink-0" />,
                  results.contacts,
                  'No contacts'
                )}
                {renderSection(
                  'Properties',
                  <Building2 size={14} className="text-neon-yellow shrink-0" />,
                  results.properties,
                  'No properties'
                )}
                {renderSection(
                  'Deals',
                  <Briefcase size={14} className="text-amber-500 shrink-0" />,
                  results.deals,
                  'No deals'
                )}
                {renderSection(
                  'Calendar',
                  <Calendar size={14} className="text-teal-500 shrink-0" />,
                  results.calendar,
                  'No calendar entries'
                )}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
