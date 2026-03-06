import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import type { Deal, DealActivity, DealDocument, DealStageId, DealDocumentCategory } from '../types';
import { uploadDealDocument as uploadDealFile, deleteStorageFile } from './storageService';
import { logActivity } from './activityService';

const DEALS_COLLECTION = 'deals';
const DEAL_ACTIVITY_COLLECTION = 'deal_activity';
const DEAL_DOCUMENTS_COLLECTION = 'deal_documents';

export const DEAL_STAGES: { id: DealStageId; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'viewing', label: 'Viewing' },
  { id: 'credit_check', label: 'Credit Check' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'notary_contract', label: 'Notary/Contract' },
  { id: 'closed', label: 'Closed' },
];

export type DealCreateInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: never; updatedAt?: never };

export async function createDeal(data: DealCreateInput): Promise<string> {
  const ref = await addDoc(collection(db, DEALS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const valueStr = data.dealType === 'rental'
    ? `$${data.financialValue.toLocaleString()}/mo`
    : `$${data.financialValue.toLocaleString()}`;
  await logActivity({
    type: 'deal',
    action: 'Deal created',
    details: `Value: ${valueStr}`,
  });
  return ref.id;
}

export async function updateDeal(
  dealId: string,
  data: Partial<Omit<Deal, 'id' | 'createdAt'>> & { updatedAt?: any }
): Promise<void> {
  const ref = doc(db, DEALS_COLLECTION, dealId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

export async function updateDealStage(dealId: string, stageId: DealStageId, order: number): Promise<void> {
  await updateDeal(dealId, { stageId, order });
}

/** Optional context to show which deal was moved in Recent Activity */
export interface DealActivityContext {
  contactName?: string;
  propertyTitle?: string;
}

export async function updateDealStageAndLog(
  dealId: string,
  stageId: DealStageId,
  order: number,
  previousStageId?: DealStageId,
  dealContext?: DealActivityContext
): Promise<void> {
  const prev = previousStageId ? DEAL_STAGES.find((s) => s.id === previousStageId)?.label : undefined;
  const next = DEAL_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
  const isReorderOnly = previousStageId === stageId;
  await updateDealStage(dealId, stageId, order);
  const activityMessage = isReorderOnly ? `Reordered in ${next}` : prev ? `Moved from ${prev} to ${next}` : `Set to ${next}`;
  await addDealActivity(
    dealId,
    'stage_change',
    activityMessage,
    { previousStageId, stageId }
  );
  const contextPart = [dealContext?.contactName, dealContext?.propertyTitle].filter(Boolean).join(' · ');
  const details = contextPart ? `${activityMessage} — ${contextPart}` : activityMessage;
  await logActivity({
    type: 'deal',
    action: isReorderOnly ? 'Deal reordered' : 'Stage updated',
    details,
  });
}

export function subscribeToDeals(callback: (deals: Deal[]) => void): () => void {
  const q = query(
    collection(db, DEALS_COLLECTION),
    orderBy('stageId'),
    orderBy('order', 'asc'),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const deals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Deal));
    callback(deals);
  });
}

/** Single query by stageId then client-side sort by order/updatedAt for flexibility */
export function subscribeToDealsSimple(callback: (deals: Deal[]) => void): () => void {
  return onSnapshot(collection(db, DEALS_COLLECTION), (snapshot) => {
    const deals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Deal));
    deals.sort((a, b) => {
      const stageOrder = DEAL_STAGES.findIndex((s) => s.id === a.stageId) - DEAL_STAGES.findIndex((s) => s.id === b.stageId);
      if (stageOrder !== 0) return stageOrder;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    callback(deals);
  });
}

export async function getDeals(): Promise<Deal[]> {
  const snapshot = await getDocs(collection(db, DEALS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Deal));
}

export async function getDealById(dealId: string): Promise<Deal | null> {
  const ref = doc(db, DEALS_COLLECTION, dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Deal;
}

/* ─── Deal activity ───────────────────────────────────────────────────────── */

export function subscribeToDealActivity(dealId: string, callback: (activities: DealActivity[]) => void): () => void {
  const q = query(
    collection(db, DEAL_ACTIVITY_COLLECTION),
    where('dealId', '==', dealId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DealActivity));
    callback(activities);
  });
}

export async function addDealActivity(
  dealId: string,
  type: DealActivity['type'],
  message: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const ref = await addDoc(collection(db, DEAL_ACTIVITY_COLLECTION), {
    dealId,
    type,
    message,
    metadata: metadata ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/* ─── Deal documents (metadata in Firestore; files in Storage via storageService) ───────────────── */

export function subscribeToDealDocuments(dealId: string, callback: (documents: DealDocument[]) => void): () => void {
  const q = query(
    collection(db, DEAL_DOCUMENTS_COLLECTION),
    where('dealId', '==', dealId),
    orderBy('uploadedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DealDocument));
    callback(documents);
  });
}

export async function addDealDocumentRecord(
  dealId: string,
  data: { name: string; storagePath: string; downloadUrl: string; category: DealDocumentCategory }
): Promise<string> {
  const ref = await addDoc(collection(db, DEAL_DOCUMENTS_COLLECTION), {
    dealId,
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteDealDocumentRecord(documentId: string): Promise<void> {
  const ref = doc(db, DEAL_DOCUMENTS_COLLECTION, documentId);
  await deleteDoc(ref);
}

export async function getDealDocumentById(documentId: string): Promise<DealDocument | null> {
  const ref = doc(db, DEAL_DOCUMENTS_COLLECTION, documentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DealDocument;
}

/** Upload file to Storage and create Firestore document record; log activity. */
export async function uploadDealDocument(
  dealId: string,
  file: File,
  category: DealDocumentCategory,
  onProgress: (progress: number) => void
): Promise<void> {
  const { storagePath, downloadUrl } = await uploadDealFile(file, dealId, onProgress);
  await addDealDocumentRecord(dealId, {
    name: file.name,
    storagePath,
    downloadUrl,
    category,
  });
  await addDealActivity(dealId, 'document_added', `Document "${file.name}" uploaded (${category})`, { category });
}

/** Delete document record and Storage file; log activity. */
export async function deleteDealDocument(documentId: string): Promise<void> {
  const rec = await getDealDocumentById(documentId);
  if (!rec) return;
  await deleteStorageFile(rec.storagePath);
  await deleteDealDocumentRecord(documentId);
  await addDealActivity(rec.dealId, 'document_removed', `Document "${rec.name}" removed`, { documentId });
}
