import axios from 'axios';
import { useRestaurantAuthStore } from '../store/restaurantAuthStore';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const rApi = axios.create({
  baseURL: `${BASE}/restaurant`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ──────────────────────────────────────────────
rApi.interceptors.request.use((config) => {
  const token = useRestaurantAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let refreshing: Promise<string> | null = null;

rApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useRestaurantAuthStore.getState();
      if (!refreshToken) { logout(); return Promise.reject(error); }

      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/restaurant/auth/refresh`, { refreshToken })
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
      return rApi(original);
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const rAuthApi = {
  login: (username: string, password: string) =>
    rApi.post('/auth/login', { username, password }),
  me: () => rApi.get('/auth/me'),
  logout: () => rApi.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    rApi.post('/auth/change-password', { currentPassword, newPassword }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const rDashboardApi = {
  stats: () => rApi.get('/dashboard/stats'),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const rMenuApi = {
  // Categories
  getCategories: () => rApi.get('/menu/categories'),
  createCategory: (data: object) => rApi.post('/menu/categories', data),
  updateCategory: (id: number, data: object) => rApi.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: number) => rApi.delete(`/menu/categories/${id}`),
  // Items
  getItems: (params?: { category_id?: number; available?: boolean }) =>
    rApi.get('/menu/items', { params }),
  getItemByNumber: (num: number) => rApi.get(`/menu/items/by-number/${num}`),
  createItem: (data: object) => rApi.post('/menu/items', data),
  updateItem: (id: number, data: object) => rApi.put(`/menu/items/${id}`, data),
  toggleItem: (id: number) => rApi.patch(`/menu/items/${id}/toggle`),
  deleteItem: (id: number) => rApi.delete(`/menu/items/${id}`),
  uploadImage: (formData: FormData) => rApi.post('/menu/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── CMS ───────────────────────────────────────────────────────────────────────
export const rCmsApi = {
  // Branding (logo + cover/hero image)
  updateBranding: (formData: FormData) =>
    rApi.patch('/cms/branding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Info & Hours
  getInfo: () => rApi.get('/cms/info'),
  updateInfo: (data: object) => rApi.put('/cms/info', data),
  // Website
  getWebsite: () => rApi.get('/cms/website'),
  updateWebsite: (data: object) => rApi.put('/cms/website', data),
  // SEO
  updateSeo: (data: object) => rApi.put('/cms/seo', data),
  // Blog
  getBlogPosts: (params?: object) => rApi.get('/cms/blog', { params }),
  createBlogPost: (data: object) => rApi.post('/cms/blog', data),
  getBlogPost: (id: number) => rApi.get(`/cms/blog/${id}`),
  updateBlogPost: (id: number, data: object) => rApi.put(`/cms/blog/${id}`, data),
  deleteBlogPost: (id: number) => rApi.delete(`/cms/blog/${id}`),
  // Reservations
  getReservations: (params?: object) => rApi.get('/cms/reservations', { params }),
  updateReservation: (id: number, data: object) => rApi.patch(`/cms/reservations/${id}`, data),
  // Events
  getEvents: (params?: object) => rApi.get('/cms/events', { params }),
  createEvent: (data: object) => rApi.post('/cms/events', data),
  getEvent: (id: number) => rApi.get(`/cms/events/${id}`),
  updateEvent: (id: number, data: object) => rApi.put(`/cms/events/${id}`, data),
  deleteEvent: (id: number) => rApi.delete(`/cms/events/${id}`),
  uploadEventImage: (formData: FormData) => rApi.post('/menu/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const rOrdersApi = {
  list:               (params?: object) => rApi.get('/orders', { params }),
  get:                (id: number)      => rApi.get(`/orders/${id}`),
  create:             (data: object)    => rApi.post('/orders', data),
  updateStatus:       (id: number, status: string) => rApi.patch(`/orders/${id}/status`, { status }),
  updatePayment:      (id: number, data: object)   => rApi.patch(`/orders/${id}/payment`, data),
  getActiveTableOrder:(tableId: number) => rApi.get(`/orders/table/${tableId}/active`),
  addItems:           (id: number, items: object[]) => rApi.patch(`/orders/${id}/add-items`, { items }),
};

// ── Tables & Areas ────────────────────────────────────────────────────────────
export const rTablesApi = {
  // Areas
  getAreas:    ()                             => rApi.get('/tables/areas'),
  createArea:  (data: object)                 => rApi.post('/tables/areas', data),
  updateArea:  (id: number, data: object)     => rApi.put(`/tables/areas/${id}`, data),
  deleteArea:  (id: number)                   => rApi.delete(`/tables/areas/${id}`),
  // Tables
  getTables:   (params?: { area_id?: number }) => rApi.get('/tables/tables', { params }),
  createBatch: (data: { area_id?: number | null; count: number; capacity: number; start_from: number }) =>
    rApi.post('/tables/tables/batch', data),
  createTable: (data: object)                 => rApi.post('/tables/tables', data),
  updateTable: (id: number, data: object)     => rApi.put(`/tables/tables/${id}`, data),
  setStatus:   (id: number, status: string)   => rApi.patch(`/tables/tables/${id}/status`, { status }),
  deleteTable: (id: number)                   => rApi.delete(`/tables/tables/${id}`),
};

// ── KDS Staff ─────────────────────────────────────────────────────────────────
export const rStaffApi = {
  list:          ()                           => rApi.get('/staff'),
  create:        (data: object)               => rApi.post('/staff', data),
  update:        (id: number, data: object)   => rApi.patch(`/staff/${id}`, data),
  delete:        (id: number)                 => rApi.delete(`/staff/${id}`),
  resetPassword: (id: number)                 => rApi.post(`/staff/${id}/reset-password`),
};
