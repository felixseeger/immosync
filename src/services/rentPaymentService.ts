import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import type { RentPayment } from '../types';

const COLLECTION = 'rent_payments';

/** Subscribe to all rent payments for a given month (e.g. '2025-07') */
export function subscribeToRentPayments(
  month: string,
  callback: (payments: RentPayment[]) => void,
): () => void {
  const q = query(collection(db, COLLECTION), where('month', '==', month));
  return onSnapshot(q, (snap) => {
    const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RentPayment);
    callback(payments);
  });
}

/** Mark a property's rent as paid for the given month */
export async function markRentPaid(propertyId: string, month: string): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    propertyId,
    month,
    paidAt: serverTimestamp(),
  });
  return ref.id;
}

/** Remove the paid mark (uncheck) */
export async function unmarkRentPaid(propertyId: string, month: string): Promise<void> {
  const q = query(
    collection(db, COLLECTION),
    where('propertyId', '==', propertyId),
    where('month', '==', month),
  );
  const snap = await getDocs(q);
  const deletions = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)));
  await Promise.all(deletions);
}
