import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

const RECENT_ACTIVITY_COLLECTION = 'recent_activity';

export type ActivityType = 'deal' | 'lead' | 'task' | 'system';

export type ActivityActionKey =
  | 'dealCreated'
  | 'dealReordered'
  | 'stageUpdated'
  | 'viewingScheduled'
  | 'newContact'
  | 'viewingMarkedCompleted'
  | 'viewingCancelled'
  | 'viewingNoShow'
  | 'viewingUpdated';

export interface LogActivityInput {
  type: ActivityType;
  action: string;
  details: string;
  /** Translation key for action (e.g. 'dealCreated'); used for i18n at display time */
  actionKey?: ActivityActionKey;
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
  const { type, action, details, actionKey, user } = input;
  await addDoc(collection(db, RECENT_ACTIVITY_COLLECTION), {
    type,
    action,
    details,
    ...(actionKey && { actionKey }),
    user: user ?? getCurrentUserName(),
    timestamp: serverTimestamp(),
  });
}
