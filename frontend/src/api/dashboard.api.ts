import api from './axios';
import type { DashboardStats, ChartDataPoint, ActivityItem, ApiResponse } from '@/types';

export const dashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getCharts: () =>
    api.get<ApiResponse<{ growth: ChartDataPoint[]; monthly: ChartDataPoint[]; distribution: Array<{ status: string; count: number }> }>>('/dashboard/charts'),

  getRecentActivity: (limit = 20) =>
    api.get<ApiResponse<ActivityItem[]>>('/dashboard/recent-activity', { params: { limit } }),

  getExpiringSubscriptions: () =>
    api.get('/dashboard/expiring-subscriptions'),

  getTopRestaurants: () =>
    api.get('/dashboard/top-restaurants'),
};
