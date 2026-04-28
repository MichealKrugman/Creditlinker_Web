'use client';

/**
 * lib/message-count-context.tsx
 *
 * Keeps a live unread message count for the sidebar badge.
 *
 * Strategy: fetch once on mount (and when activeBusiness changes), then
 * re-fetch on visibilitychange — i.e. only when the user returns to the tab.
 * No interval polling, so there are zero unnecessary API calls.
 * The messages page calls refresh() immediately after opening a thread.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { getAllMessages } from './api';
import { useActiveBusiness } from './business-context';

interface MessageCountContextValue {
  unreadCount: number;
  refresh: () => void;
}

const MessageCountContext = createContext<MessageCountContextValue>({
  unreadCount: 0,
  refresh: () => {},
});

export function MessageCountProvider({ children }: { children: React.ReactNode }) {
  const { activeBusiness } = useActiveBusiness();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const res = await getAllMessages();
      const total = res.threads.reduce((sum, t) => sum + t.business_unread, 0);
      setUnreadCount(total);
    } catch {
      // silently ignore — stale badge is fine
    }
  }, [activeBusiness]);

  // Fetch on mount and whenever the active business changes
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Re-fetch when the user comes back to the tab — no polling needed
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchCount]);

  return (
    <MessageCountContext.Provider value={{ unreadCount, refresh: fetchCount }}>
      {children}
    </MessageCountContext.Provider>
  );
}

export function useMessageCount(): MessageCountContextValue {
  return useContext(MessageCountContext);
}
