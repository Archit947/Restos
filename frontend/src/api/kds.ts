import axios from 'axios';
import { useKdsAuthStore } from '../store/kdsAuthStore';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const kdsApi = axios.create({ baseURL: `${BASE}/kds` });

// Attach KDS access token
kdsApi.interceptors.request.use((config) => {
  const token = useKdsAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing: Promise<string> | null = null;
kdsApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useKdsAuthStore.getState();
      if (!refreshToken) { logout(); return Promise.reject(error); }

      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/kds/auth/refresh`, { refreshToken })
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
      return kdsApi(original);
    }
    return Promise.reject(error);
  }
);

export const kdsAuthApi = {
  login:   (username: string, password: string) => kdsApi.post('/auth/login', { username, password }),
  me:      ()                                    => kdsApi.get('/auth/me'),
  logout:  (refreshToken?: string)               => kdsApi.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string)                => kdsApi.post('/auth/refresh', { refreshToken }),
};

export const kdsOrdersApi = {
  list:         (params?: object) => kdsApi.get('/orders', { params }),
  updateStatus: (id: number, status: string) => kdsApi.patch(`/orders/${id}/status`, { status }),
};
