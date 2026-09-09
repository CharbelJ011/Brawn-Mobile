import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/api/client';
import type { BrawnUser, LoginInput } from '@/types/auth';

const SESSION_KEY = 'brawn.mobile.session';
const TOKEN_KEY = 'brawn.mobile.access-token';

type AuthContextValue = {
  user: BrawnUser | null;
  loading: boolean;
  signIn(input: LoginInput): Promise<BrawnUser>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type LoginResponse = { accessToken?: string; user: BrawnUser };

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<BrawnUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((value) => { if (value) setUser(JSON.parse(value)); })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signIn(input) {
      const result = await apiRequest<LoginResponse>('/mobile-auth/login', {
        method: 'POST', body: JSON.stringify(input),
      });
      const nextUser = result.user;
      setUser(nextUser);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextUser));
      if (result.accessToken) await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
      return nextUser;
    },
    async signOut() {
      setUser(null);
      await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEY),
        SecureStore.deleteItemAsync(TOKEN_KEY),
      ]);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
