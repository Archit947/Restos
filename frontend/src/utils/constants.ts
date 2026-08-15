export const CUISINE_TYPES = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese',
  'Thai', 'French', 'Mediterranean', 'Middle Eastern', 'Korean', 'Greek',
  'Spanish', 'Vietnamese', 'Indonesian', 'Malaysian', 'Fusion', 'Fast Food',
  'Cafe', 'Bakery', 'Desserts', 'Seafood', 'Vegetarian', 'Vegan',
  'Biryani', 'Pizza', 'Burger', 'Sushi', 'BBQ', 'Continental',
];

export const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'UAE', 'Singapore', 'Malaysia', 'Germany', 'France', 'Japan', 'Other',
];

export const RESTAURANT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'trial', label: 'Trial', color: 'blue' },
  { value: 'expired', label: 'Expired', color: 'red' },
  { value: 'suspended', label: 'Suspended', color: 'orange' },
];

export const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  'auth.login': { label: 'Login', icon: '🔐', color: 'green' },
  'auth.logout': { label: 'Logout', icon: '🚪', color: 'gray' },
  'auth.login.failed': { label: 'Login Failed', icon: '⚠️', color: 'red' },
  'restaurant.created': { label: 'Restaurant Created', icon: '🏪', color: 'green' },
  'restaurant.updated': { label: 'Restaurant Updated', icon: '✏️', color: 'blue' },
  'restaurant.deleted': { label: 'Restaurant Deleted', icon: '🗑️', color: 'red' },
  'restaurant.suspended': { label: 'Restaurant Suspended', icon: '🚫', color: 'orange' },
  'restaurant.activated': { label: 'Restaurant Activated', icon: '✅', color: 'green' },
  'restaurant.password_reset': { label: 'Password Reset', icon: '🔑', color: 'yellow' },
  'website.published': { label: 'Website Published', icon: '🌐', color: 'green' },
  'website.unpublished': { label: 'Website Unpublished', icon: '📴', color: 'gray' },
  'plan.changed': { label: 'Plan Changed', icon: '💳', color: 'purple' },
  'template.created': { label: 'Template Created', icon: '🎨', color: 'green' },
  'settings.updated': { label: 'Settings Updated', icon: '⚙️', color: 'blue' },
  'cms.reset': { label: 'CMS Reset', icon: '🔄', color: 'red' },
};

export const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN || 'restos.com';
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
