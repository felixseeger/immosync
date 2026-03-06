import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

const RECENT_ACTIVITY_COLLECTION = 'recent_activity';

export type ActivityType = 'deal' | 'lead' | 'task' | 'system';

export interface LogActivityInput {
  type: ActivityType;
  action: string;
  details: string;
  /** Override display name; defaults to current user displayName or email */
  user?: string;
}

function getCurrentUserName(): string {
  const u = auth.currentUser;
  if (!u) return 'Someone';
  return u.displayName?.trim() || u.email || 'Someone';
}

/**
 * Append an item to the Recent Activity stream (Firestore `recent_activity`).
 * Used when creating/updating deals, viewings, contacts, etc.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  const { type, action, details, user } = input;
  await addDoc(collection(db, RECENT_ACTIVITY_COLLECTION), {
    type,
    action,
    details,
    user: user ?? getCurrentUserName(),
    timestamp: serverTimestamp(),
  });
}
