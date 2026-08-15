import api from './axios';
import type { SubscriptionPlan, WebsiteTemplate, PlatformSetting, ApiResponse } from '@/types';

export const settingsApi = {
  getAll: (group?: string) =>
    api.get<ApiResponse<Record<string, PlatformSetting[]>>>('/settings', { params: { group } }),

  update: (settings: Array<{ key: string; value: string }>) =>
    api.put('/settings', { settings }),

  getPlans: () =>
    api.get<ApiResponse<SubscriptionPlan[]>>('/settings/plans/list'),

  getTemplates: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<WebsiteTemplate[]>>('/templates', { params }),

  createTemplate: (data: FormData) =>
    api.post('/templates', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateTemplate: (id: number, data: FormData) =>
    api.put(`/templates/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  deleteTemplate: (id: number) =>
    api.delete(`/templates/${id}`),
};
