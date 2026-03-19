import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MessageSquare,
  Send,
  User,
  Loader2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { subscribeToConversations, subscribeToMessages, createMessage, getOrCreateConversation } from '../services/messagesService';
import { subscribeToUsers } from '../services/usersService';
import type { Conversation, Message, UserProfile } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { sfx } from '../utils/sfx';
import { useLanguage } from '../contexts/LanguageContext';

function getMessageDate(m: Message): Date | null {
  const raw = m.createdAt;
  if (!raw) return null;
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') return (raw as { toDate: () => Date }).toDate();
  if (raw instanceof Date) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getConversationDate(c: Conversation): Date | null {
  const raw = c.updatedAt ?? c.createdAt;
  if (!raw) return null;
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') return (raw as { toDate: () => Date }).toDate();
  if (raw instanceof Date) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

interface MessagesViewProps {
  currentUser: FirebaseUser;
}

export default function MessagesView({ currentUser }: MessagesViewProps) {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composeText, setComposeText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newContactId, setNewContactId] = useState('');
  const [starting, setStarting] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToConversations(currentUser.uid, setConversations);
    return unsub;
  }, [currentUser.uid]);
  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return () => {};
    }
    const unsub = subscribeToMessages(selectedId, setMessages);
    return unsub;
  }, [selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const userMap = useMemo(() => {
    const m: Record<string, UserProfile> = {};
    users.forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  const selectedConversation = useMemo(
    () => (selectedId ? conversations.find((c) => c.id === selectedId) : null),
    [conversations, selectedId]
  );

  const selectedOtherParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    const otherId = selectedConversation.participantIds.find((id) => id !== currentUser.uid) ?? null;
    return otherId ? userMap[otherId] ?? null : null;
  }, [selectedConversation, currentUser.uid, userMap]);

  const selectedParticipantName =
    selectedOtherParticipant?.displayName ?? selectedOtherParticipant?.email ?? t.messages.unknownUser;

  const handleSend = async () => {
    const text = composeText.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setComposeText('');
    try {
      await createMessage({
        conversationId: selectedId,
        senderId: currentUser.uid,
        body: text,
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async () => {
    if (!newContactId.trim() || starting) return;
    setStarting(true);
    try {
      const convId = await getOrCreateConversation([currentUser.uid, newContactId]);
      setSelectedId(convId);
      setShowNewModal(false);
      setNewContactId('');
    } finally {
      setStarting(false);
    }
  };

  const selectableUsers = useMemo(
    () => users.filter((u) => u.id !== currentUser.uid),
    [users, currentUser.uid]
  );

  return (
    <div className="h-full flex flex-col bg-app-light dark:bg-app-dark">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-app-light/90 dark:bg-app-dark/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.messages.title}</h2>
        <button
          type="button"
          onClick={() => { sfx.menuSelect(); setShowNewModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg text-sm btn-outline-accent [&_svg]:text-current"
        >
          <Plus size={18} />
          <span>{t.messages.newConversation}</span>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Conversation list */}
        <aside className="w-full sm:w-80 shrink-0 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-gray-50/50 dark:bg-zinc-900/30">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  {t.messages.noConversationsYet}
                </p>
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); setShowNewModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-lg text-sm btn-outline-accent [&_svg]:text-current"
                >
                  <Plus size={18} />
                  <span>{t.messages.startConversation}</span>
                </button>
              </div>
            ) : (
              <ul className="p-2">
                {conversations.map((c) => {
                  const otherId = c.participantIds.find((id) => id !== currentUser.uid);
                  const otherUser = otherId ? userMap[otherId] : undefined;
                  const name = otherUser?.displayName ?? otherUser?.email ?? t.messages.unknownUser;
                  const updated = getConversationDate(c);
                  const isSelected = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-accent/20 dark:bg-accent/10 border border-accent/30'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                          <User size={18} className="text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{name}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {updated ? format(updated, 'MMM d, HH:mm', { locale: de }) : '—'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread */}
        <main className="flex-1 flex flex-col min-w-0 bg-app-light dark:bg-app-dark">
          {selectedId ? (
            <>
              <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                  <User size={16} className="text-gray-500 dark:text-zinc-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedParticipantName}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((m) => {
                  const d = getMessageDate(m);
                  const isOut = m.senderId === currentUser.uid;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          isOut
                            ? 'bg-accent dark:bg-zinc-700 text-white rounded-br-md'
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-bl-md'
                        }`}
                      >
                        <p className={`text-sm whitespace-pre-wrap wrap-break-word ${isOut ? 'text-white' : ''}`}>{m.body ?? ''}</p>
                        {d && (
                          <p className={`text-[10px] mt-1 ${isOut ? 'text-white/80' : 'text-gray-500 dark:text-zinc-400'}`}>
                            {format(d, 'MMM d, HH:mm', { locale: de })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>
              <div className="shrink-0 p-4 border-t border-gray-200 dark:border-zinc-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    placeholder={t.messages.typeMessagePlaceholder}
                    className="flex-1 min-w-0 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-accent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !composeText.trim()}
                    className="p-2.5 rounded-xl bg-accent text-white dark:text-black font-bold hover:opacity-90 disabled:opacity-50 transition-opacity [&_svg]:text-current [&_svg]:shrink-0"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 size={20} className="animate-spin text-black" /> : <Send size={20} className="text-black" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-zinc-500">
              <div className="text-center">
                <MessageSquare className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" size={48} />
                <p className="text-sm">{t.messages.selectOrStart}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New conversation modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { sfx.menuClose(); setShowNewModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transition-colors duration-200"
            >
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-accent/15 border-2 border-accent/40">
                    <MessageSquare size={18} className="text-accent" />
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                    {t.messages.newConversation}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => { sfx.menuClose(); setShowNewModal(false); }}
                  className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    User
                  </label>
                  <select
                    value={newContactId}
                    onChange={(e) => { sfx.menuSelect(); setNewContactId(e.target.value); }}
                    className={
                      'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors ' +
                      (newContactId ? 'text-accent border-accent' : 'text-gray-900 dark:text-white')
                    }
                  >
                    <option value="">{t.messages.selectUser}</option>
                    {selectableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName ?? u.email ?? u.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { sfx.menuClose(); setShowNewModal(false); }}
                    className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-medium text-sm transition-colors duration-200 border border-transparent dark:border-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-700 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => { sfx.menuSelect(); handleStartConversation(); }}
                    disabled={!newContactId.trim() || starting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 btn-outline-accent [&_svg]:text-current"
                  >
                    {starting ? <Loader2 size={18} className="animate-spin text-accent" /> : null}
                    {t.messages.start}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
