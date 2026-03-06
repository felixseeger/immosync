import { db } from '../firebase';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

export async function upsertUserProfile(user: FirebaseUser): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  await setDoc(
    ref,
    {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  const ref = collection(db, USERS_COLLECTION);
  return onSnapshot(ref, (snapshot) => {
    const list = snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          ...d.data(),
        }) as UserProfile
    );
    callback(list);
  });
}

