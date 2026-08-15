// ============================================================
// Restos Admin - TypeScript Type Definitions
// ============================================================

// Auth Types
export interface SuperAdmin {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  avatar: string | null;
  lastLoginAt: string | null;
}

export interface AuthState {
  user: SuperAdmin | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SuperAdmin;
}

// Restaurant Types
export type RestaurantStatus = 'active' | 'inactive' | 'trial' | 'expired' | 'suspended';
export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type WebsiteStatus = 'draft' | 'published' | 'unpublished';
export type PlanSlug = 'starter' | 'professional' | 'enterprise';

export interface Restaurant {
  id: number;
  tenant_id: string;
  restaurant_name: string;
  business_name: string | null;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  gst_number: string | null;
  pan_number: string | null;
  business_reg_no: string | null;
  cuisine_type: string | null;
  description: string | null;
  logo: string | null;
  cover_image: string | null;
  status: RestaurantStatus;
  account_status: AccountStatus;
  plan_id: number | null;
  plan_name: string | null;
  plan_slug: PlanSlug | null;
  city: string | null;
  state: string | null;
  country: string | null;
  restaurant_uid: string | null;
  username: string | null;
  credential_active: boolean;
  last_login_at: string | null;
  website_status: WebsiteStatus | null;
  website_enabled: boolean;
  subdomain: string | null;
  full_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantDetail extends Restaurant {
  address: RestaurantAddress | null;
  cms_pages_count: number;
  blog_count: number;
  event_count: number;
  reservation_count: number;
  sub_status: string | null;
  trial_ends_at: string | null;
  expires_at: string | null;
  blog_enabled: boolean;
  reservation_enabled: boolean;
  event_enabled: boolean;
  affiliate_enabled: boolean;
  marketing_enabled: boolean;
  storage_used_mb: number;
  // Credentials (super admin only)
  user_id: number | null;
  temp_password: string | null;
  login_attempts: number;
  is_first_login: boolean;
  website_title: string | null;
  website_subtitle: string | null;
  custom_domain: string | null;
  ssl_enabled: boolean;
}

export interface RestaurantAddress {
  id: number;
  restaurant_id: number;
  country: string;
  state: string;
  city: string;
  area: string | null;
  zip_code: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

// Wizard Form Data
export interface RestaurantFormStep1 {
  restaurant_name: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  gst_number: string;
  pan_number: string;
  business_reg_no: string;
  cuisine_type: string;
  description: string;
  logo?: File | null;
  cover_image?: File | null;
}

export interface RestaurantFormStep2 {
  country: string;
  state: string;
  city: string;
  area: string;
  zip_code: string;
  address: string;
  latitude: string;
  longitude: string;
}

export interface RestaurantFormStep3 {
  website_title: string;
  website_subtitle: string;
  subdomain: string;
}

export interface RestaurantFormStep4 {
  plan_id: number | string;
  trial_days: number;
  status: RestaurantStatus;
  website_enabled: boolean;
  cms_enabled: boolean;
  blog_enabled: boolean;
  reservation_enabled: boolean;
  event_enabled: boolean;
  affiliate_enabled: boolean;
  marketing_enabled: boolean;
}

export interface RestaurantFormData extends
  RestaurantFormStep1,
  RestaurantFormStep2,
  RestaurantFormStep3,
  RestaurantFormStep4 {}

// Subscription Plan
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: PlanSlug;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  trial_days: number;
  storage_limit_mb: number;
  max_pages: number;
  max_blog_posts: number;
  max_events: number;
  max_reservations: number;
  website_enabled: boolean;
  cms_enabled: boolean;
  blog_enabled: boolean;
  reservation_enabled: boolean;
  event_enabled: boolean;
  affiliate_enabled: boolean;
  marketing_enabled: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  is_active: boolean;
}

// Website Template
export interface WebsiteTemplate {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  preview_url: string | null;
  category: string;
  version: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

// Dashboard Types
export interface DashboardStats {
  restaurants: {
    total: number;
    active: number;
    inactive: number;
    trial: number;
    expired: number;
    suspended: number;
    newThisMonth: number;
  };
  websites: {
    total: number;
    published: number;
    enabled: number;
  };
  cms: { totalPages: number };
  content: {
    totalBlogPosts: number;
    totalEvents: number;
    totalReservations: number;
  };
  storage: { totalUsedMB: number };
  planDistribution: Array<{ name: string; slug: string; count: number }>;
}

export interface ChartDataPoint {
  month: string;
  label: string;
  count: number;
}

export interface ActivityItem {
  id: number;
  action: string;
  entity_type: string | null;
  entity_name: string | null;
  description: string | null;
  user_email: string | null;
  user_name: string | null;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

// Audit Log
export interface AuditLog {
  id: number;
  user_id: number | null;
  user_type: string;
  user_email: string | null;
  admin_name: string | null;
  tenant_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

// Notification
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Platform Setting
export interface PlatformSetting {
  id: number;
  key: string;
  value: string | null;
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret';
  group: string;
  label: string | null;
  description: string | null;
  is_public: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Table Types
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Filter Types
export interface RestaurantFilters {
  search: string;
  status: string;
  plan_id: string;
  city: string;
  country: string;
  sort: string;
  order: 'ASC' | 'DESC';
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Wizard Step
export interface WizardStep {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
}
