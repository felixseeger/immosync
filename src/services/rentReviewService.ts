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
import type { RentReview } from '../types';

const COLLECTION = 'rent_reviews';

/** Subscribe to all rent reviews for a given month (e.g. '2025-07') */
export function subscribeToRentReviews(
  month: string,
  callback: (reviews: RentReview[]) => void,
): () => void {
  const q = query(collection(db, COLLECTION), where('month', '==', month));
  return onSnapshot(q, (snap) => {
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RentReview);
    callback(reviews);
  });
}

/** Mark a property's rent as reviewed for the given month */
export async function markRentReviewed(propertyId: string, month: string): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    propertyId,
    month,
    reviewedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Remove the review mark (uncheck) */
export async function unmarkRentReviewed(propertyId: string, month: string): Promise<void> {
  const q = query(
    collection(db, COLLECTION),
    where('propertyId', '==', propertyId),
    where('month', '==', month),
  );
  const snap = await getDocs(q);
  const deletions = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)));
  await Promise.all(deletions);
}
