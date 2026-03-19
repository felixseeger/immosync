import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { DollarSign, User, Building2 } from 'lucide-react';
import type { Deal } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

function formatValue(value: number, dealType: 'sale' | 'rental'): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

interface DealCardProps {
  deal: Deal;
  contactName: string;
  propertyTitle: string;
  index: number;
  onClick: () => void;
  /** Optional Tailwind border-left class for stage color (e.g. border-l-4 border-l-blue-500) */
  stageBorderClass?: string;
}

export default function DealCard({ deal, contactName, propertyTitle, index, onClick, stageBorderClass }: DealCardProps) {
  const { t } = useLanguage();
  const valueLabel = deal.dealType === 'sale' ? t.deal.commission : t.deal.rent;
  const valueStr = formatValue(deal.financialValue, deal.dealType);

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            rounded-xl border p-4 cursor-pointer transition-all
            glass border-gray-200/50 dark:border-white/10
            hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5
            ${stageBorderClass ?? 'border-l-4 border-l-gray-300 dark:border-l-zinc-600'}
            ${snapshot.isDragging ? 'opacity-90 shadow-xl ring-2 ring-accent/50 border-accent' : ''}
          `}
        >
          <div className="flex items-start gap-2 mb-2">
            <User size={14} className="text-gray-500 dark:text-zinc-500 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={contactName}>
              {contactName || '—'}
            </span>
          </div>
          <div className="flex items-start gap-2 mb-2">
            <Building2 size={14} className="text-gray-500 dark:text-zinc-500 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-600 dark:text-zinc-400 truncate" title={propertyTitle}>
              {propertyTitle || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <DollarSign size={14} className="text-accent shrink-0" />
            <span className="text-xs text-gray-500 dark:text-zinc-500">{valueLabel}</span>
            <span className="text-sm font-bold text-accent ml-auto">{valueStr}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
