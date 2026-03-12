import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
const RECENT_ACTIVITY_COLLECTION = 'recent_activity';
function getCurrentUserName() {
    const u = auth.currentUser;
    if (!u)
        return 'Someone';
    return u.displayName?.trim() || u.email || 'Someone';
}
/**
 * Append an item to the Recent Activity stream (Firestore `recent_activity`).
 * Used when creating/updating deals, viewings, contacts, etc.
 */
export async function logActivity(input) {
    const { type, action, details, user } = input;
    await addDoc(collection(db, RECENT_ACTIVITY_COLLECTION), {
        type,
        action,
        details,
        user: user ?? getCurrentUserName(),
        timestamp: serverTimestamp(),
    });
}
