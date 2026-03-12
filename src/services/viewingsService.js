import { db } from '../firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, } from 'firebase/firestore';
import { logActivity } from './activityService';
const VIEWINGS_COLLECTION = 'viewings';
function stripUndefined(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined)
            out[k] = v;
    }
    return out;
}
export async function createViewing(data, 
/** Optional description for Recent Activity (e.g. "123 Main St with John Doe") */
activityDetail) {
    const payload = stripUndefined({
        propertyId: data.propertyId,
        contactId: data.contactId,
        eventType: data.eventType ?? 'viewing',
        scheduledAt: data.scheduledAt,
        status: data.status ?? 'scheduled',
        ...(data.note?.trim() ? { note: data.note.trim() } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    const ref = await addDoc(collection(db, VIEWINGS_COLLECTION), payload);
    await logActivity({
        type: 'task',
        action: 'Viewing scheduled',
        details: activityDetail?.trim() || 'New viewing',
    });
    return ref.id;
}
export async function updateViewing(viewingId, data) {
    const ref = doc(db, VIEWINGS_COLLECTION, viewingId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}
export async function deleteViewing(viewingId) {
    const ref = doc(db, VIEWINGS_COLLECTION, viewingId);
    await deleteDoc(ref);
}
export function subscribeToViewingsByProperty(propertyId, callback) {
    const q = query(collection(db, VIEWINGS_COLLECTION), where('propertyId', '==', propertyId), orderBy('scheduledAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const viewings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(viewings);
    });
}
export function subscribeToViewings(callback) {
    const q = query(collection(db, VIEWINGS_COLLECTION), orderBy('scheduledAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const viewings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(viewings);
    });
}
export async function getViewings() {
    const q = query(collection(db, VIEWINGS_COLLECTION), orderBy('scheduledAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
