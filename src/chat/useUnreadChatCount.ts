import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { apiRequest } from '@/api/client';

type ConversationUnread = { unreadCount?: number };

export function useUnreadChatCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const conversations = await apiRequest<ConversationUnread[]>('/mobile-auth/chat/conversations');
      setCount(conversations.reduce((total, conversation) => total + Math.max(0, Number(conversation.unreadCount) || 0), 0));
    } catch {
      // A tab badge must never interrupt navigation if chat is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  return count;
}
