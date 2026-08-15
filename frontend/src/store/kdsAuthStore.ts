import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface KdsStaff {
  id: number;
  name: string;
  stationName: string;
  restaurantId: number;
  restaurantName: string;
  logo: string | null;
}

interface KdsAuthState {
  accessToken:  string | null;
  refreshToken: string | null;
  staff:        KdsStaff | null;
  isAuthenticated: boolean;

  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setStaff:  (staff: KdsStaff) => void;
  login:     (tokens: { accessToken: string; refreshToken: string }, staff: KdsStaff) => void;
  logout:    () => void;
}

export const useKdsAuthStore = create<KdsAuthState>()(
  persist(
    (set) => ({
      accessToken:     null,
      refreshToken:    null,
      staff:           null,
      isAuthenticated: false,

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      setStaff: (staff) => set({ staff }),

      login: ({ accessToken, refreshToken }, staff) =>
        set({ accessToken, refreshToken, staff, isAuthenticated: true }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, staff: null, isAuthenticated: false }),
    }),
    {
      name:    'kds-auth',
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        staff:        state.staff,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
