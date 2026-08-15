import slugify from 'slugify';
import { config } from '../config';

/**
 * Generate a URL-safe subdomain slug from a restaurant name
 */
export function generateSubdomainSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,  // removes all special chars
    trim: true,
    replacement: '',  // remove spaces, not replace with dash
  }).replace(/-+/g, '').substring(0, 63);
}

/**
 * Validate a subdomain slug
 */
export function validateSubdomainSlug(slug: string): { valid: boolean; reason?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, reason: 'Subdomain must be at least 3 characters' };
  }
  if (slug.length > 63) {
    return { valid: false, reason: 'Subdomain must be at most 63 characters' };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && !/^[a-z0-9]+$/.test(slug)) {
    return { valid: false, reason: 'Subdomain can only contain lowercase letters, numbers, and hyphens' };
  }
  if (config.reservedSubdomains.includes(slug.toLowerCase())) {
    return { valid: false, reason: 'This subdomain is reserved and cannot be used' };
  }
  return { valid: true };
}

/**
 * Build the full subdomain URL
 */
export function buildSubdomainUrl(slug: string): string {
  return `${slug}.${config.platform.domain}`;
}

/**
 * Generate a unique restaurant login ID
 */
export function generateRestaurantLoginId(sequenceNumber: number): string {
  return `RST-${String(sequenceNumber).padStart(4, '0')}`;
}

/**
 * Generate a tenant code
 */
export function generateTenantCode(sequenceNumber: number): string {
  return `TEN-${String(sequenceNumber).padStart(4, '0')}`;
}

/**
 * Generate a random temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure it has uppercase, lowercase, number, and special char
  return password;
}

/**
 * Generate a random confirmation code
 */
export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
