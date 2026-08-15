import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreUser {
  id: number;
  tenantId: string;
  restaurantId: number;
  restaurantName: string;
  logo?: string | null;
  username: string;
  isFirstLogin?: boolean;
}

interface StoreAuthState {
  accessToken:     string | null;
  refreshToken:    string | null;
  store:           StoreUser | null;
  isAuthenticated: boolean;

  setAuth:    (tokens: { accessToken: string; refreshToken: string }, store: StoreUser) => void;
  setTokens:  (tokens: { accessToken: string; refreshToken: string }) => void;
  logout:     () => void;
}

export const useStoreAuthStore = create<StoreAuthState>()(
  persist(
    (set) => ({
      accessToken:     null,
      refreshToken:    null,
      store:           null,
      isAuthenticated: false,

      setAuth: (tokens, store) =>
        set({ ...tokens, store, isAuthenticated: true }),

      setTokens: (tokens) =>
        set(tokens),

      logout: () =>
        set({ accessToken: null, refreshToken: null, store: null, isAuthenticated: false }),
    }),
    {
      name: 'store-auth',
      partialize: (s) => ({
        accessToken:     s.accessToken,
        refreshToken:    s.refreshToken,
        store:           s.store,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
