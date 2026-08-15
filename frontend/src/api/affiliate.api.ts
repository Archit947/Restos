import api from './axios';

const BASE = '/affiliate';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AffiliateStatus = 'draft' | 'active' | 'inactive' | 'scheduled';
export type AffiliatePlacement =
  | 'homepage_hero'
  | 'homepage_section'
  | 'menu_page'
  | 'blog_page'
  | 'sidebar'
  | 'footer'
  | 'between_sections';

export interface AffiliateProduct {
  id: number;
  affiliate_url: string;
  asin: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  rating: number | null;
  brand: string | null;
  placement: AffiliatePlacement;
  status: AffiliateStatus;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateFetchResult {
  asin: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  price: number | null;
  rating: number | null;
  brand: string | null;
  affiliate_url: string;
}

export interface AffiliateStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  scheduled: number;
  total_clicks: number;
  recentClicks: { title: string; clicks: number }[];
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export const affiliateAdminApi = {
  /** Scrape product metadata from an affiliate URL */
  fetchProduct: (affiliate_url: string) =>
    api.post<{ data: AffiliateFetchResult }>(`${BASE}/admin/fetch`, { affiliate_url }),

  list: (params?: Record<string, string | number | undefined>) =>
    api.get<{ data: AffiliateProduct[]; meta: any }>(`${BASE}/admin`, { params }),

  getById: (id: number) =>
    api.get<{ data: AffiliateProduct }>(`${BASE}/admin/${id}`),

  stats: () =>
    api.get<{ data: AffiliateStats }>(`${BASE}/admin/stats`),

  create: (data: Partial<AffiliateProduct>) =>
    api.post<{ data: AffiliateProduct }>(`${BASE}/admin`, data),

  update: (id: number, data: Partial<AffiliateProduct>) =>
    api.put<{ data: AffiliateProduct }>(`${BASE}/admin/${id}`, data),

  setStatus: (id: number, status: AffiliateStatus) =>
    api.patch(`${BASE}/admin/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete(`${BASE}/admin/${id}`),
};

// ── Public API (used on public restaurant sites) ───────────────────────────────

export const affiliatePublicApi = {
  getByPlacement: (placement: AffiliatePlacement, limit = 6) =>
    api.get<{ data: AffiliateProduct[] }>(`${BASE}/public`, { params: { placement, limit } }),

  trackClick: (id: number, placement: AffiliatePlacement) =>
    api.post<{ data: { redirect_url: string } }>(`${BASE}/public/${id}/click`, { placement }),
};

export const PLACEMENT_LABELS: Record<AffiliatePlacement, string> = {
  homepage_hero:     'Homepage — Hero',
  homepage_section:  'Homepage — Section',
  menu_page:         'Food Menu Page',
  blog_page:         'Blog / Stories Page',
  sidebar:           'Sidebar',
  footer:            'Footer',
  between_sections:  'Between Sections',
};
