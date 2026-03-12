import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit, } from 'firebase/firestore';
import { uploadDealDocument as uploadDealFile, deleteStorageFile } from './storageService';
import { logActivity } from './activityService';
const DEALS_COLLECTION = 'deals';
const DEAL_ACTIVITY_COLLECTION = 'deal_activity';
const DEAL_DOCUMENTS_COLLECTION = 'deal_documents';
export const DEAL_STAGES = [
    { id: 'lead', label: 'Lead' },
    { id: 'viewing', label: 'Besichtigungen' },
    { id: 'credit_check', label: 'Kreditabfrage' },
    { id: 'negotiation', label: 'Verhandlungen' },
    { id: 'maintenance', label: 'Wartungen' },
    { id: 'notary_contract', label: 'Notar / Vertrag' },
    { id: 'closed', label: 'Closed' },
];
export async function createDeal(data) {
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
export async function updateDeal(dealId, data) {
    const ref = doc(db, DEALS_COLLECTION, dealId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}
export async function updateDealStage(dealId, stageId, order) {
    await updateDeal(dealId, { stageId, order });
}
export async function updateDealStageAndLog(dealId, stageId, order, previousStageId, dealContext) {
    const prev = previousStageId ? DEAL_STAGES.find((s) => s.id === previousStageId)?.label : undefined;
    const next = DEAL_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
    const isReorderOnly = previousStageId === stageId;
    await updateDealStage(dealId, stageId, order);
    const activityMessage = isReorderOnly ? `Reordered in ${next}` : prev ? `Moved from ${prev} to ${next}` : `Set to ${next}`;
    await addDealActivity(dealId, 'stage_change', activityMessage, { previousStageId, stageId });
    const contextPart = [dealContext?.contactName, dealContext?.propertyTitle].filter(Boolean).join(' · ');
    const details = contextPart ? `${activityMessage} — ${contextPart}` : activityMessage;
    await logActivity({
        type: 'deal',
        action: isReorderOnly ? 'Deal reordered' : 'Stage updated',
        details,
    });
}
export function subscribeToDeals(callback) {
    const q = query(collection(db, DEALS_COLLECTION), orderBy('stageId'), orderBy('order', 'asc'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const deals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(deals);
    });
}
/** Single query by stageId then client-side sort by order/updatedAt for flexibility */
export function subscribeToDealsSimple(callback) {
    return onSnapshot(collection(db, DEALS_COLLECTION), (snapshot) => {
        const deals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        deals.sort((a, b) => {
            const stageOrder = DEAL_STAGES.findIndex((s) => s.id === a.stageId) - DEAL_STAGES.findIndex((s) => s.id === b.stageId);
            if (stageOrder !== 0)
                return stageOrder;
            return (a.order ?? 0) - (b.order ?? 0);
        });
        callback(deals);
    });
}
export async function getDeals() {
    const snapshot = await getDocs(collection(db, DEALS_COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function getDealById(dealId) {
    const ref = doc(db, DEALS_COLLECTION, dealId);
    const snap = await getDoc(ref);
    if (!snap.exists())
        return null;
    return { id: snap.id, ...snap.data() };
}
/* ─── Deal activity ───────────────────────────────────────────────────────── */
export function subscribeToDealActivity(dealId, callback) {
    const q = query(collection(db, DEAL_ACTIVITY_COLLECTION), where('dealId', '==', dealId), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(activities);
    });
}
export async function addDealActivity(dealId, type, message, metadata) {
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
export function subscribeToDealDocuments(dealId, callback) {
    const q = query(collection(db, DEAL_DOCUMENTS_COLLECTION), where('dealId', '==', dealId), orderBy('uploadedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const documents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(documents);
    });
}
export async function addDealDocumentRecord(dealId, data) {
    const ref = await addDoc(collection(db, DEAL_DOCUMENTS_COLLECTION), {
        dealId,
        ...data,
        uploadedAt: serverTimestamp(),
    });
    return ref.id;
}
export async function deleteDealDocumentRecord(documentId) {
    const ref = doc(db, DEAL_DOCUMENTS_COLLECTION, documentId);
    await deleteDoc(ref);
}
export async function getDealDocumentById(documentId) {
    const ref = doc(db, DEAL_DOCUMENTS_COLLECTION, documentId);
    const snap = await getDoc(ref);
    if (!snap.exists())
        return null;
    return { id: snap.id, ...snap.data() };
}
/** Upload file to Storage and create Firestore document record; log activity. */
export async function uploadDealDocument(dealId, file, category, onProgress) {
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
export async function deleteDealDocument(documentId) {
    const rec = await getDealDocumentById(documentId);
    if (!rec)
        return;
    await deleteStorageFile(rec.storagePath);
    await deleteDealDocumentRecord(documentId);
    await addDealActivity(rec.dealId, 'document_removed', `Document "${rec.name}" removed`, { documentId });
}
