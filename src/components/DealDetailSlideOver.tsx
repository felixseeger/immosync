import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Loader2,
  User,
  Building2,
  DollarSign,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Activity,
  FolderOpen,
  Briefcase,
} from 'lucide-react';
import AnimatedLink from './AnimatedLink';
import { formatDistanceToNow } from 'date-fns';
import {
  DEAL_STAGES,
  subscribeToDealActivity,
  subscribeToDealDocuments,
  uploadDealDocument,
  deleteDealDocument,
  addDealActivity,
  updateDealStageAndLog,
} from '../services/dealsService';
import type { Deal, DealActivity, DealDocument, DealStageId, DealDocumentCategory } from '../types';

const DOC_CATEGORIES: { value: DealDocumentCategory; label: string }[] = [
  { value: 'lease', label: 'Lease agreement' },
  { value: 'credit_check', label: 'Credit check' },
  { value: 'notary', label: 'Notary draft' },
  { value: 'other', label: 'Other' },
];

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors';

function formatValue(value: number, dealType: 'sale' | 'rental'): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

interface DealDetailSlideOverProps {
  deal: Deal | null;
  contactName?: string;
  propertyTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
  onSelectContact?: (contactId: string) => void;
  onSelectProperty?: (propertyId: string) => void;
}

export default function DealDetailSlideOver({
  deal,
  contactName,
  propertyTitle,
  onClose,
  onSelectContact,
  onSelectProperty,
}: DealDetailSlideOverProps) {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DealDocumentCategory>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!deal) return;
    const unsubActivity = subscribeToDealActivity(deal.id, setActivities);
    const unsubDocs = subscribeToDealDocuments(deal.id, setDocuments);
    return () => {
      unsubActivity();
      unsubDocs();
    };
  }, [deal?.id]);

  const handleUploadClick = (category: DealDocumentCategory) => {
    setUploadCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !deal) return;
    e.target.value = '';
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadDealDocument(deal.id, file, uploadCategory, (p) => setUploadProgress(p));
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await deleteDealDocument(documentId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !deal || addingNote) return;
    setAddingNote(true);
    try {
      await addDealActivity(deal.id, 'note', note.trim());
      setNote('');
    } finally {
      setAddingNote(false);
    }
  };

  const handleStageChange = async (stageId: DealStageId) => {
    if (!deal || deal.stageId === stageId || stageUpdating) return;
    setStageUpdating(true);
    try {
      const dealContext = { contactName: contactName, propertyTitle: propertyTitle };
      await updateDealStageAndLog(deal.id, stageId, deal.order ?? 0, deal.stageId, dealContext);
    } finally {
      setStageUpdating(false);
    }
  };

  if (!deal) return null;

  const valueLabel = deal.dealType === 'sale' ? 'Commission' : 'Rent';

  const panelContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex justify-end"
        style={{ zIndex: 9999 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deal-panel-title"
        >
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-accent/15 border-2 border-accent/40">
                <Briefcase size={18} className="text-accent" />
              </span>
              <h2 id="deal-panel-title" className="text-lg font-bold text-gray-900 dark:text-white">
                Deal details
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Deal info */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Deal
              </h3>
              <div className="space-y-2 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <User size={16} className="text-gray-500 dark:text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{contactName || '—'}</span>
                  {onSelectContact && deal?.contactId ? (
                    <AnimatedLink
                      onClick={() => { onSelectContact(deal.contactId); onClose(); }}
                      className="text-xs font-medium flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink size={12} />
                      View contact
                    </AnimatedLink>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 size={16} className="text-gray-500 dark:text-zinc-500 shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400 truncate">{propertyTitle || '—'}</span>
                  {onSelectProperty && deal?.propertyId ? (
                    <AnimatedLink
                      onClick={() => { onSelectProperty(deal.propertyId); onClose(); }}
                      className="text-xs font-medium flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink size={12} />
                      View property
                    </AnimatedLink>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-accent shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-zinc-500">{valueLabel}</span>
                  <span className="text-sm font-bold text-accent">{formatValue(deal.financialValue, deal.dealType)}</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Stage
                  </label>
                  <select
                    value={deal.stageId}
                    onChange={(e) => handleStageChange(e.target.value as DealStageId)}
                    disabled={stageUpdating}
                    className={inputCls + ' text-sm'}
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {stageUpdating && (
                    <Loader2 size={14} className="animate-spin text-accent mt-1 inline-block" />
                  )}
                </div>
              </div>
            </section>

            {/* Document management */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FolderOpen size={14} />
                Documents
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={handleFileChange}
              />
              <div className="flex flex-wrap gap-2 mb-3">
                {DOC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleUploadClick(cat.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    {cat.label}
                  </button>
                ))}
              </div>
              {uploading && (
                <div className="mb-3 h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700"
                  >
                    <FileText size={16} className="text-gray-500 dark:text-zinc-500 shrink-0" />
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-gray-900 dark:text-white truncate hover:text-accent transition-colors flex items-center gap-1"
                    >
                      {doc.name}
                      <ExternalLink size={12} />
                    </a>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase">{doc.category}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded text-gray-500 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                      title="Remove document"
                    >
                      {deletingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
              {documents.length === 0 && !uploading && (
                <p className="text-sm text-gray-500 dark:text-zinc-500 py-4 text-center">
                  No documents yet. Upload lease agreements, credit checks, or notary drafts above.
                </p>
              )}
            </section>

            {/* Activity feed */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={14} />
                Activity
              </h3>
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note…"
                  className={inputCls + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!note.trim() || addingNote}
                  className="px-4 py-2.5 bg-accent text-white dark:text-black font-bold rounded-lg text-sm border-2 border-accent hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {addingNote ? <Loader2 size={16} className="animate-spin" /> : null}
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {activities.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/30 border border-gray-100 dark:border-zinc-800"
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'stage_change' && <Activity size={14} className="text-accent" />}
                      {item.type === 'note' && <FileText size={14} className="text-blue-500" />}
                      {item.type === 'document_added' && <Upload size={14} className="text-green-500" />}
                      {item.type === 'document_removed' && <Trash2 size={14} className="text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{item.message}</p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5">
                        {item.createdAt?.toDate
                          ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
                          : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {activities.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-zinc-500 py-4 text-center">
                  No activity yet. Changes and notes will appear here.
                </p>
              )}
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
