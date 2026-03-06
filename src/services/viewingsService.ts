import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import type { Viewing } from '../types';

const VIEWINGS_COLLECTION = 'viewings';

export type ViewingCreateInput = Omit<Viewing, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: never;
  updatedAt?: never;
};

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function createViewing(data: ViewingCreateInput): Promise<string> {
  const payload = stripUndefined({
    propertyId: data.propertyId,
    contactId: data.contactId,
    scheduledAt: data.scheduledAt,
    status: data.status ?? 'scheduled',
    ...(data.note?.trim() ? { note: data.note.trim() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const ref = await addDoc(collection(db, VIEWINGS_COLLECTION), payload);
  return ref.id;
}

export async function updateViewing(
  viewingId: string,
  data: Partial<Omit<Viewing, 'id' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, VIEWINGS_COLLECTION, viewingId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

export function subscribeToViewingsByProperty(propertyId: string, callback: (viewings: Viewing[]) => void): () => void {
  const q = query(
    collection(db, VIEWINGS_COLLECTION),
    where('propertyId', '==', propertyId),
    orderBy('scheduledAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const viewings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Viewing));
    callback(viewings);
  });
}

export function subscribeToViewings(callback: (viewings: Viewing[]) => void): () => void {
  const q = query(collection(db, VIEWINGS_COLLECTION), orderBy('scheduledAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const viewings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Viewing));
    callback(viewings);
  });
}

export async function getViewings(): Promise<Viewing[]> {
  const q = query(collection(db, VIEWINGS_COLLECTION), orderBy('scheduledAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Viewing));
}
