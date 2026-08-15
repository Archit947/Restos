import api from './axios';
import type { Restaurant, RestaurantDetail, RestaurantFormData, ApiResponse, PaginationMeta } from '@/types';

export interface RestaurantListResponse {
  data: Restaurant[];
  meta: PaginationMeta;
}

export const restaurantsApi = {
  list: (params: Record<string, string | number | undefined>) =>
    api.get<ApiResponse<Restaurant[]> & { meta: PaginationMeta }>('/restaurants', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<RestaurantDetail>>(`/restaurants/${id}`),

  create: (data: FormData) =>
    api.post<ApiResponse<{ restaurantId: number; tenantId: string; restaurantUID: string; username: string; tempPassword: string; subdomain: string; fullDomain: string }>>('/restaurants', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.put<ApiResponse<RestaurantDetail>>(`/restaurants/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateStatus: (id: number, status: string) =>
    api.patch<ApiResponse>(`/restaurants/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/restaurants/${id}`),

  resetPassword: (id: number) =>
    api.post<ApiResponse<{ tempPassword: string }>>(`/restaurants/${id}/reset-password`),

  changePlan: (id: number, plan_id: number) =>
    api.patch<ApiResponse>(`/restaurants/${id}/plan`, { plan_id }),

  bulkAction: (ids: number[], action: string) =>
    api.post<ApiResponse>('/restaurants/bulk', { ids, action }),

  checkSubdomain: (subdomain: string, excludeId?: number) =>
    api.get<ApiResponse<{ available: boolean; subdomain: string; full_domain: string; reason: string | null }>>('/restaurants/check-subdomain', {
      params: { subdomain, exclude_id: excludeId },
    }),

  getStoreCredentials: (id: number) =>
    api.get<ApiResponse<{
      store_user_id: number; username: string; temp_password: string;
      is_active: boolean; is_first_login: boolean; last_login_at: string | null;
      login_attempts: number; created_at: string;
    }>>(`/restaurants/${id}/store-credentials`),
};
