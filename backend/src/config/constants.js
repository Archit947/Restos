'use strict';

module.exports = {
  // Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    SUPPORT: 'support',
    RESTAURANT: 'restaurant',
  },

  // Restaurant Statuses
  RESTAURANT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    TRIAL: 'trial',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended',
  },

  // Account Statuses
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  },

  // Website Statuses
  WEBSITE_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    UNPUBLISHED: 'unpublished',
  },

  // Subscription Statuses
  SUB_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    TRIAL: 'trial',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
  },

  // CMS Page Types (auto-generated for each restaurant)
  DEFAULT_PAGES: [
    { title: 'Home', slug: 'home', page_type: 'home', sort_order: 1, is_default: true },
    { title: 'About Us', slug: 'about', page_type: 'about', sort_order: 2, is_default: true },
    { title: 'Menu', slug: 'menu', page_type: 'menu', sort_order: 3, is_default: true },
    { title: 'Gallery', slug: 'gallery', page_type: 'gallery', sort_order: 4, is_default: true },
    { title: 'Reservations', slug: 'reservation', page_type: 'reservation', sort_order: 5, is_default: true },
    { title: 'Events', slug: 'events', page_type: 'events', sort_order: 6, is_default: true },
    { title: 'Blog', slug: 'blog', page_type: 'blog', sort_order: 7, is_default: true },
    { title: 'Contact', slug: 'contact', page_type: 'contact', sort_order: 8, is_default: true },
    { title: 'Privacy Policy', slug: 'privacy-policy', page_type: 'privacy', sort_order: 9, is_default: true },
    { title: 'Terms & Conditions', slug: 'terms', page_type: 'terms', sort_order: 10, is_default: true },
  ],

  // Reserved subdomains that restaurants cannot use
  RESERVED_SUBDOMAINS: [
    'www', 'api', 'admin', 'superadmin', 'dashboard', 'app', 'mail', 'email',
    'smtp', 'ftp', 'ssh', 'vpn', 'cdn', 'assets', 'static', 'media', 'img',
    'images', 'files', 'docs', 'help', 'support', 'status', 'blog', 'news',
    'login', 'logout', 'register', 'signup', 'auth', 'oauth', 'sso',
    'restaurant', 'restaurants', 'tenant', 'tenants', 'restos', 'platform',
    'panel', 'portal', 'manager', 'management', 'console', 'control',
    'dev', 'staging', 'test', 'qa', 'production', 'prod', 'sandbox',
    'demo', 'example', 'sample', 'template', 'themes',
    'account', 'accounts', 'user', 'users', 'profile', 'settings',
    'billing', 'payment', 'checkout', 'invoice', 'subscription',
    'analytics', 'reports', 'metrics', 'monitoring',
    'about', 'contact', 'privacy', 'terms', 'legal',
  ],

  // Default Navigation
  DEFAULT_NAVIGATION: {
    header: [
      { label: 'Home', url: '/' },
      { label: 'Menu', url: '/menu' },
      { label: 'About', url: '/about' },
      { label: 'Gallery', url: '/gallery' },
      { label: 'Events', url: '/events' },
      { label: 'Contact', url: '/contact' },
    ],
    footer: [
      { label: 'Privacy Policy', url: '/privacy-policy' },
      { label: 'Terms & Conditions', url: '/terms' },
      { label: 'Blog', url: '/blog' },
    ],
  },

  // Audit Actions
  AUDIT_ACTIONS: {
    // Auth
    AUTH_LOGIN: 'auth.login',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_FAILED: 'auth.login.failed',
    AUTH_PASSWORD_RESET: 'auth.password_reset',

    // Restaurant
    RESTAURANT_CREATED: 'restaurant.created',
    RESTAURANT_UPDATED: 'restaurant.updated',
    RESTAURANT_DELETED: 'restaurant.deleted',
    RESTAURANT_SUSPENDED: 'restaurant.suspended',
    RESTAURANT_ACTIVATED: 'restaurant.activated',
    RESTAURANT_PASSWORD_RESET: 'restaurant.password_reset',

    // Website
    WEBSITE_PUBLISHED: 'website.published',
    WEBSITE_UNPUBLISHED: 'website.unpublished',
    WEBSITE_ENABLED: 'website.enabled',
    WEBSITE_DISABLED: 'website.disabled',
    WEBSITE_TEMPLATE_CHANGED: 'website.template_changed',

    // CMS
    CMS_PAGE_CREATED: 'cms.page.created',
    CMS_PAGE_UPDATED: 'cms.page.updated',
    CMS_PAGE_DELETED: 'cms.page.deleted',
    CMS_SETTINGS_UPDATED: 'cms.settings.updated',
    CMS_RESET: 'cms.reset',

    // Plan
    PLAN_CHANGED: 'plan.changed',
    PLAN_RENEWED: 'plan.renewed',
    PLAN_EXPIRED: 'plan.expired',

    // Template
    TEMPLATE_CREATED: 'template.created',
    TEMPLATE_UPDATED: 'template.updated',
    TEMPLATE_DELETED: 'template.deleted',
    TEMPLATE_ASSIGNED: 'template.assigned',

    // Settings
    SETTINGS_UPDATED: 'settings.updated',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    RESTAURANT_CREATED: 'restaurant.created',
    RESTAURANT_SUSPENDED: 'restaurant.suspended',
    RESTAURANT_DELETED: 'restaurant.deleted',
    PLAN_EXPIRED: 'plan.expired',
    PLAN_EXPIRING_SOON: 'plan.expiring_soon',
    WEBSITE_PUBLISHED: 'website.published',
    CMS_UPDATED: 'cms.updated',
    DOMAIN_GENERATED: 'domain.generated',
  },

  // Cuisine types
  CUISINE_TYPES: [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese',
    'Thai', 'French', 'Mediterranean', 'Middle Eastern', 'Korean', 'Greek',
    'Spanish', 'Vietnamese', 'Indonesian', 'Malaysian', 'Fusion', 'Fast Food',
    'Cafe', 'Bakery', 'Desserts', 'Seafood', 'Vegetarian', 'Vegan',
    'Biryani', 'Pizza', 'Burger', 'Sushi', 'BBQ', 'Continental',
  ],

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
