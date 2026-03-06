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
    contactId: data.contactId,
    dealId: data.dealId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Get or create a conversation for this contact (and optional deal). */
export async function getOrCreateConversation(contactId: string, dealId?: string): Promise<string> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('contactId', '==', contactId),
    where('dealId', '==', dealId ?? null)
  );
  const snapshot = await getDocs(q);
  if (snapshot.docs.length > 0) return snapshot.docs[0].id;
  return createConversation({ contactId, dealId });
}

export function subscribeToConversations(callback: (conversations: Conversation[]) => void): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
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
    direction: data.direction,
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
