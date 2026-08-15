-- ============================================================
-- Restos SaaS Platform - Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- 1. Super Admin (password: Admin@123)
-- ============================================================
INSERT INTO `super_admins` (`name`, `email`, `password_hash`, `role`, `is_active`, `email_verified_at`) VALUES
('Super Administrator', 'admin@restos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RlnkISwi.', 'super_admin', 1, NOW());

-- Note: password_hash above is bcrypt hash of 'Admin@123'
-- Generate fresh hash via: node -e "const b=require('bcrypt');b.hash('Admin@123',12).then(console.log)"

-- ============================================================
-- 2. Subscription Plans
-- ============================================================
INSERT INTO `subscription_plans`
(`name`, `slug`, `description`, `price_monthly`, `price_yearly`, `trial_days`, `storage_limit_mb`,
 `max_pages`, `max_blog_posts`, `max_events`, `max_reservations`,
 `website_enabled`, `cms_enabled`, `blog_enabled`, `reservation_enabled`, `event_enabled`,
 `affiliate_enabled`, `marketing_enabled`, `custom_domain`, `priority_support`, `is_active`, `sort_order`) VALUES

('Starter', 'starter',
 'Perfect for small restaurants just getting started online.',
 999.00, 9990.00, 14, 512, 5, 10, 5, 50,
 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1),

('Professional', 'professional',
 'For growing restaurants that need more features and capacity.',
 2499.00, 24990.00, 14, 2048, 20, 50, 20, 500,
 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 2),

('Enterprise', 'enterprise',
 'Full-featured plan for restaurant chains and large operations.',
 4999.00, 49990.00, 30, 10240, 100, 500, 100, 5000,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3);

-- ============================================================
-- 3. Default Website Templates
-- ============================================================
INSERT INTO `website_templates` (`name`, `slug`, `description`, `category`, `version`, `is_active`, `is_default`, `config`) VALUES
('Modern Classic', 'modern-classic', 'Clean and modern design suitable for any restaurant type.', 'modern', '1.0.0', 1, 1,
 '{"colors":{"primary":"#e53e3e","secondary":"#1a202c"},"fonts":{"heading":"Playfair Display","body":"Inter"}}'),

('Elegant Dining', 'elegant-dining', 'Sophisticated template designed for fine dining restaurants.', 'fine_dining', '1.0.0', 1, 0,
 '{"colors":{"primary":"#744210","secondary":"#1a202c"},"fonts":{"heading":"Cormorant Garamond","body":"Lato"}}'),

('Street Food Vibes', 'street-food-vibes', 'Bold and colorful template for fast food and street food joints.', 'fast_food', '1.0.0', 1, 0,
 '{"colors":{"primary":"#f6ad55","secondary":"#2d3748"},"fonts":{"heading":"Montserrat","body":"Open Sans"}}'),

('Cafe Minimalist', 'cafe-minimalist', 'Minimal and clean template perfect for cafes and bakeries.', 'cafe', '1.0.0', 1, 0,
 '{"colors":{"primary":"#68d391","secondary":"#2d3748"},"fonts":{"heading":"Nunito","body":"Poppins"}}');

-- ============================================================
-- 4. Platform Settings
-- ============================================================
INSERT INTO `platform_settings` (`key`, `value`, `type`, `group`, `label`, `description`, `is_public`) VALUES
('platform_name', 'Restos', 'string', 'general', 'Platform Name', 'The name of your SaaS platform', 1),
('platform_domain', 'restos.com', 'string', 'general', 'Platform Domain', 'Primary domain of the platform', 1),
('platform_tagline', 'Power Your Restaurant Online', 'string', 'general', 'Platform Tagline', 'Short tagline shown on the platform', 1),
('platform_logo', '', 'string', 'general', 'Platform Logo', 'Path to platform logo', 1),
('platform_favicon', '', 'string', 'general', 'Platform Favicon', 'Path to platform favicon', 1),
('default_timezone', 'Asia/Kolkata', 'string', 'general', 'Default Timezone', 'Default timezone for new restaurants', 0),
('default_currency', 'INR', 'string', 'general', 'Default Currency', 'Default currency for the platform', 1),
('default_language', 'en', 'string', 'general', 'Default Language', 'Default language', 1),
('date_format', 'DD/MM/YYYY', 'string', 'general', 'Date Format', 'Display date format', 0),
('maintenance_mode', 'false', 'boolean', 'general', 'Maintenance Mode', 'Put the platform in maintenance mode', 0),
('restaurant_login_url', '/restaurant/login', 'string', 'general', 'Restaurant Login URL', 'URL for restaurant owner login', 1),
('subdomain_suffix', '.restos.com', 'string', 'general', 'Subdomain Suffix', 'Suffix appended to restaurant subdomains', 1),
('smtp_host', '', 'string', 'email', 'SMTP Host', 'SMTP server hostname', 0),
('smtp_port', '587', 'string', 'email', 'SMTP Port', 'SMTP server port', 0),
('smtp_user', '', 'string', 'email', 'SMTP Username', 'SMTP authentication username', 0),
('smtp_pass', '', 'secret', 'email', 'SMTP Password', 'SMTP authentication password', 0),
('smtp_from_name', 'Restos Platform', 'string', 'email', 'From Name', 'Email sender display name', 0),
('smtp_from_email', 'noreply@restos.com', 'string', 'email', 'From Email', 'Email sender address', 0),
('storage_driver', 'local', 'string', 'storage', 'Storage Driver', 'File storage driver (local/s3)', 0),
('storage_base_url', '/uploads', 'string', 'storage', 'Storage Base URL', 'Base URL for accessing uploaded files', 0),
('max_upload_size_mb', '10', 'number', 'storage', 'Max Upload Size (MB)', 'Maximum file upload size in MB', 0),
('allowed_image_types', '["image/jpeg","image/png","image/webp","image/gif"]', 'json', 'storage', 'Allowed Image Types', 'MIME types allowed for image upload', 0),
('jwt_access_expiry', '15m', 'string', 'security', 'JWT Access Token Expiry', 'How long access tokens are valid', 0),
('jwt_refresh_expiry', '7d', 'string', 'security', 'JWT Refresh Token Expiry', 'How long refresh tokens are valid', 0),
('rate_limit_window_ms', '900000', 'number', 'security', 'Rate Limit Window (ms)', 'Rate limiting window in milliseconds', 0),
('rate_limit_max_requests', '100', 'number', 'security', 'Rate Limit Max Requests', 'Max requests per window', 0),
('password_min_length', '8', 'number', 'security', 'Password Min Length', 'Minimum password length', 0),
('login_max_attempts', '5', 'number', 'security', 'Login Max Attempts', 'Max failed login attempts before lockout', 0),
('login_lockout_minutes', '30', 'number', 'security', 'Login Lockout (minutes)', 'Account lockout duration in minutes', 0);

-- ============================================================
-- 5. Reserved Subdomains (cannot be used by restaurants)
-- ============================================================
-- These are tracked via application logic in constants.js
