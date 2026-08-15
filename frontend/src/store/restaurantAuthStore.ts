import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RestaurantUser {
  id: number;
  tenantId: string;
  restaurantId: number;
  name: string;
  logo?: string | null;
  cuisineType?: string | null;
  username: string;
  isFirstLogin?: boolean;
}

interface RestaurantAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  restaurant: RestaurantUser | null;
  isAuthenticated: boolean;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, restaurant: RestaurantUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const useRestaurantAuthStore = create<RestaurantAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      restaurant: null,
      isAuthenticated: false,

      setAuth: (tokens, restaurant) =>
        set({ ...tokens, restaurant, isAuthenticated: true }),

      setTokens: (tokens) =>
        set(tokens),

      logout: () =>
        set({ accessToken: null, refreshToken: null, restaurant: null, isAuthenticated: false }),
    }),
    { name: 'restaurant-auth' }
  )
);
