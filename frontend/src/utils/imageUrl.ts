/**
 * Resolve a possibly-relative image path to a full URL.
 *
 * Paths stored in the database are root-relative (/uploads/...).
 * Vite proxies /uploads → backend in dev; Nginx does the same in production.
 * Absolute URLs (http/https) are returned unchanged.
 */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already absolute – return as-is (handles legacy rows that stored the full URL)
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Root-relative path – Vite proxy / Nginx will forward to backend
  if (path.startsWith('/')) return path;
  // Bare filename fallback
  return `/uploads/${path}`;
}
