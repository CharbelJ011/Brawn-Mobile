import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { apiRequest } from '@/api/client';

type UnreadResponse = { count?: number };

export function useUnreadChatCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const result = await apiRequest<UnreadResponse>('/mobile-auth/chat/unread-count');
      setCount(Math.max(0, Number(result?.count) || 0));
    } catch (error) {
      console.warn('[Brawn Chat] unable to refresh unread count', error instanceof Error ? error.message : String(error));
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
