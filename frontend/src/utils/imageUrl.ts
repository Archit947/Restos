/**
 * Resolve a possibly-relative image path to a full URL.
 *
 * In development, Vite proxies /uploads → backend.
 * In production (Vercel + Render), no proxy exists — all /uploads/* paths
 * must be prefixed with the backend origin so the browser fetches from Render.
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

// e.g. "https://restos-787l.onrender.com"  (strip /api/v1 suffix)
const BACKEND_ORIGIN = (() => {
  try {
    return API_BASE ? new URL(API_BASE).origin : '';
  } catch {
    return '';
  }
})();

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already absolute — return unchanged
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Root-relative — prepend backend origin so browser hits Render, not Vercel
  if (path.startsWith('/')) return `${BACKEND_ORIGIN}${path}`;
  // Bare filename fallback
  return `${BACKEND_ORIGIN}/uploads/${path}`;
}
