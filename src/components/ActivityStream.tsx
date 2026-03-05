import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { Activity, User, FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActivityItem {
  id: string;
  type: 'deal' | 'lead' | 'task' | 'system';
  action: string;
  details: string;
  user: string;
  timestamp: Timestamp;
}

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'deal': return <DollarSign size={16} className="text-green-500" />;
    case 'lead': return <User size={16} className="text-blue-500" />;
    case 'task': return <CheckCircle size={16} className="text-yellow-500" />;
    case 'system': return <AlertCircle size={16} className="text-red-500" />;
    default: return <Activity size={16} className="text-zinc-500" />;
  }
};

export default function ActivityStream() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'recent_activity'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityItem[];
      setActivities(newActivities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Activity size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No recent activity found.</p>
        <p className="text-xs mt-1">Actions will appear here in real-time.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence initial={false}>
        {activities.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex gap-3 mb-4 group hover:bg-zinc-900/50 p-2 rounded-lg transition-colors"
          >
            <div className="mt-1 relative">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative z-10">
                <ActivityIcon type={item.type} />
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-zinc-800 -z-0 last:hidden" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {item.action}
                </p>
                <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                  {item.timestamp?.toDate ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                {item.details}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] text-zinc-300">
                  {item.user.charAt(0)}
                </div>
                <span className="text-[10px] text-zinc-500">{item.user}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
