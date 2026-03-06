import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import type { Conversation, Message } from '../types';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

export type ConversationCreateInput = Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: never;
  updatedAt?: never;
};

export type MessageCreateInput = Omit<Message, 'id' | 'createdAt'> & { createdAt?: never };

export async function createConversation(data: ConversationCreateInput): Promise<string> {
  const ref = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
    participantIds: data.participantIds,
    dealId: data.dealId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Get or create a conversation for this exact set of participants (and optional deal). */
export async function getOrCreateConversation(participantIds: string[], dealId?: string): Promise<string> {
  if (participantIds.length === 0) {
    throw new Error('participantIds must not be empty');
  }
  // For now we support 1:1 conversations, so we can query by participants individually.
  // We still store the full array on the document for future extensibility.
  const [userA, userB] = participantIds;
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participantIds', 'array-contains', userA),
    where('dealId', '==', dealId ?? null)
  );
  const snapshot = await getDocs(q);
  // Filter client-side to ensure both users are present (in case of future group chats)
  const existing = snapshot.docs
    .map((d) => ({ id: d.id, ...(d.data() as Conversation) }))
    .find((c) => {
      const participants = new Set(c.participantIds);
      return participantIds.every((id) => participants.has(id));
    });
  if (existing) return existing.id;
  return createConversation({ participantIds, dealId });
}

export function subscribeToConversations(currentUserId: string, callback: (conversations: Conversation[]) => void): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participantIds', 'array-contains', currentUserId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
    callback(list);
  });
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const ref = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Conversation;
}

export async function createMessage(data: MessageCreateInput): Promise<string> {
  const ref = await addDoc(collection(db, MESSAGES_COLLECTION), {
    conversationId: data.conversationId,
    senderId: data.senderId,
    body: data.body,
    userId: data.userId ?? null,
    createdAt: serverTimestamp(),
  });
  const convRef = doc(db, CONVERSATIONS_COLLECTION, data.conversationId);
  await updateDoc(convRef, { updatedAt: serverTimestamp() });
  return ref.id;
}

export function subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    list.sort((a, b) => {
      const toTime = (v: unknown): number => {
        if (!v) return 0;
        if (typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate().getTime();
        const d = new Date(v as string | number | Date);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return toTime(a.createdAt) - toTime(b.createdAt);
    });
    callback(list);
  });
}
