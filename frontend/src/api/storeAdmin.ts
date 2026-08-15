import axios from 'axios';
import { useStoreAuthStore } from '../store/storeAuthStore';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const sApi = axios.create({
  baseURL: `${BASE}/store`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ──────────────────────────────────────────────
sApi.interceptors.request.use((config) => {
  const token = useStoreAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let refreshing: Promise<string> | null = null;

sApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useStoreAuthStore.getState();
      if (!refreshToken) { logout(); return Promise.reject(error); }

      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/store/auth/refresh`, { refreshToken })
          .then((r) => {
            const { accessToken, refreshToken: newRT } = r.data.data;
            setTokens({ accessToken, refreshToken: newRT });
            return accessToken;
          })
          .catch(() => { logout(); throw error; })
          .finally(() => { refreshing = null; });
      }

      const newToken = await refreshing;
      original.headers.Authorization = `Bearer ${newToken}`;
      return sApi(original);
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const storeAuthApi = {
  login:          (data: { username: string; password: string }) => sApi.post('/auth/login', data),
  logout:         (refreshToken?: string) => sApi.post('/auth/logout', { refreshToken }),
  me:             () => sApi.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => sApi.post('/auth/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const storeDashboardApi = {
  get: () => sApi.get('/dashboard'),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const storeCategoriesApi = {
  list:   ()                        => sApi.get('/items/categories'),
  create: (data: any)               => sApi.post('/items/categories', data),
  update: (id: number, data: any)   => sApi.patch(`/items/categories/${id}`, data),
  delete: (id: number)              => sApi.delete(`/items/categories/${id}`),
};

// ── Items ─────────────────────────────────────────────────────────────────────
export const storeItemsApi = {
  list:        (params?: any)                => sApi.get('/items', { params }),
  create:      (formData: FormData)          => sApi.post('/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:      (id: number, formData: FormData) => sApi.patch(`/items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStock: (id: number, data: { quantity: number; operation?: 'set' | 'add' | 'subtract' }) =>
               sApi.patch(`/items/${id}/stock`, data),
  delete:      (id: number)                 => sApi.delete(`/items/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const storeOrdersApi = {
  list:          (params?: any)   => sApi.get('/orders', { params }),
  get:           (id: number)     => sApi.get(`/orders/${id}`),
  updateStatus:  (id: number, status: string)         => sApi.patch(`/orders/${id}/status`, { status }),
  updatePayment: (id: number, payment_status: string) => sApi.patch(`/orders/${id}/payment`, { payment_status }),
};
