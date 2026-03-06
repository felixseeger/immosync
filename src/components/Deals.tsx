import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Briefcase, Loader2, Plus, Filter } from 'lucide-react';
import { getProperties } from '../services/propertyService';
import {
  subscribeToDealsSimple,
  updateDealStageAndLog,
  DEAL_STAGES,
} from '../services/dealsService';
import type { Deal, DealType } from '../types';
import type { Contact } from '../types';
import type { Property } from '../types';
import { subscribeToContacts } from '../services/contactsService';
import DealCard from './DealCard';
import DealDetailSlideOver from './DealDetailSlideOver';
import AddDealPanel from './AddDealPanel';
import { sfx } from '../utils/sfx';

const TRACK_OPTIONS: { value: 'all' | DealType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'Sales' },
  { value: 'rental', label: 'Rentals' },
];

const STAGE_COLORS: Record<string, { borderLeft: string; headerBg: string; headerText: string; columnBg: string }> = {
  lead: { borderLeft: 'border-l-4 border-l-blue-500', headerBg: 'bg-blue-500/25 dark:bg-blue-500/30', headerText: 'text-blue-800 dark:text-blue-200 font-bold', columnBg: 'bg-blue-500/5 dark:bg-blue-500/10' },
  viewing: { borderLeft: 'border-l-4 border-l-violet-500', headerBg: 'bg-violet-500/25 dark:bg-violet-500/30', headerText: 'text-violet-800 dark:text-violet-200 font-bold', columnBg: 'bg-violet-500/5 dark:bg-violet-500/10' },
  credit_check: { borderLeft: 'border-l-4 border-l-amber-500', headerBg: 'bg-amber-500/25 dark:bg-amber-500/30', headerText: 'text-amber-800 dark:text-amber-200 font-bold', columnBg: 'bg-amber-500/5 dark:bg-amber-500/10' },
  negotiation: { borderLeft: 'border-l-4 border-l-orange-500', headerBg: 'bg-orange-500/25 dark:bg-orange-500/30', headerText: 'text-orange-800 dark:text-orange-200 font-bold', columnBg: 'bg-orange-500/5 dark:bg-orange-500/10' },
  notary_contract: { borderLeft: 'border-l-4 border-l-teal-500', headerBg: 'bg-teal-500/25 dark:bg-teal-500/30', headerText: 'text-teal-800 dark:text-teal-200 font-bold', columnBg: 'bg-teal-500/5 dark:bg-teal-500/10' },
  closed: { borderLeft: 'border-l-4 border-l-emerald-500', headerBg: 'bg-emerald-500/25 dark:bg-emerald-500/30', headerText: 'text-emerald-800 dark:text-emerald-200 font-bold', columnBg: 'bg-emerald-500/5 dark:bg-emerald-500/10' },
};

interface DealsProps {
  onSelectContact?: (contactId: string) => void;
  onSelectProperty?: (propertyId: string) => void;
  initialSelectedDealId?: string | null;
  onClearInitialDealSelection?: () => void;
}

export default function Deals({
  onSelectContact,
  onSelectProperty,
  initialSelectedDealId,
  onClearInitialDealSelection,
}: DealsProps = {}) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [trackFilter, setTrackFilter] = useState<'all' | DealType>('all');
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAddDeal, setShowAddDeal] = useState(false);

  useEffect(() => {
    const unsubDeals = subscribeToDealsSimple((list) => setDeals(list));
    const unsubContacts = subscribeToContacts((list) => setContacts(list));
    getProperties()
      .then(setProperties)
      .finally(() => setLoading(false));
    return () => {
      unsubDeals();
      unsubContacts();
    };
  }, []);

  useEffect(() => {
    if (!initialSelectedDealId || !onClearInitialDealSelection) return;
    const deal = deals.find((d) => d.id === initialSelectedDealId);
    if (deal) {
      setSelectedDeal(deal);
      onClearInitialDealSelection();
    }
  }, [deals, initialSelectedDealId, onClearInitialDealSelection]);

  const contactMap = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const propertyMap = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const filteredDeals = useMemo(() => {
    if (trackFilter === 'all') return deals;
    return deals.filter((d) => d.dealType === trackFilter);
  }, [deals, trackFilter]);

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    DEAL_STAGES.forEach((s) => (map[s.id] = []));
    filteredDeals.forEach((d) => {
      if (!map[d.stageId]) map[d.stageId] = [];
      map[d.stageId].push(d);
    });
    DEAL_STAGES.forEach((s) => {
      map[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return map;
  }, [filteredDeals]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId as Deal['stageId'];
    const newIndex = result.destination.index;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    if (deal.stageId === newStageId && (deal.order ?? 0) === newIndex) return;
    const contact = contactMap.get(deal.contactId);
    const property = propertyMap.get(deal.propertyId);
    const dealContext = {
      contactName: contact?.name || contact?.email,
      propertyTitle: property?.title || property?.address,
    };
    await updateDealStageAndLog(dealId, newStageId, newIndex, deal.stageId, dealContext);
  };

  if (loading && deals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-yellow" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-app-dark">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white/90 dark:bg-app-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase size={28} className="text-neon-yellow" />
            Deals
          </h2>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800">
            {TRACK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTrackFilter(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  trackFilter === opt.value
                    ? 'bg-gray-300 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { sfx.menuSelect(); setShowAddDeal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D9FF00] text-black font-bold rounded-lg text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#D9FF00] focus:ring-offset-2 [&_svg]:text-current"
        >
          <Plus size={18} />
          Create Deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max h-full">
            {DEAL_STAGES.map((stage) => {
              const colors = STAGE_COLORS[stage.id] ?? { borderLeft: '', headerBg: '', headerText: 'text-gray-900 dark:text-white', columnBg: '' };
              return (
              <div
                key={stage.id}
                className={`w-72 shrink-0 flex flex-col rounded-xl border-2 border-gray-200 dark:border-zinc-700 overflow-hidden ${colors.borderLeft} ${colors.columnBg || 'bg-gray-50/50 dark:bg-zinc-900/50'}`}
              >
                <div className={`p-3 border-b-2 border-gray-200 dark:border-zinc-700 flex items-center justify-between ${colors.headerBg}`}>
                  <h3 className={`text-sm ${colors.headerText}`}>{stage.label}</h3>
                  <span className="text-xs font-medium text-gray-600 dark:text-zinc-400 bg-white/60 dark:bg-app-dark/30 px-2.5 py-1 rounded-full">
                    {(dealsByStage[stage.id] ?? []).length}
                  </span>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 overflow-y-auto space-y-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-neon-yellow/10 dark:bg-neon-yellow/15' : ''
                      }`}
                    >
                      {(dealsByStage[stage.id] ?? []).map((deal, index) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          contactName={contactMap.get(deal.contactId)?.name ?? '—'}
                          propertyTitle={propertyMap.get(deal.propertyId)?.title ?? '—'}
                          index={index}
                          onClick={() => setSelectedDeal(deal)}
                          stageBorderClass={STAGE_COLORS[deal.stageId]?.borderLeft}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <DealDetailSlideOver
        deal={selectedDeal}
        contactName={selectedDeal ? contactMap.get(selectedDeal.contactId)?.name : undefined}
        propertyTitle={selectedDeal ? propertyMap.get(selectedDeal.propertyId)?.title : undefined}
        onClose={() => setSelectedDeal(null)}
        onSuccess={() => setSelectedDeal(null)}
        onSelectContact={onSelectContact}
        onSelectProperty={onSelectProperty}
      />

      {showAddDeal && (
        <AddDealPanel
          contacts={contacts}
          properties={properties}
          onClose={() => setShowAddDeal(false)}
          onSuccess={() => setShowAddDeal(false)}
        />
      )}
    </div>
  );
}
