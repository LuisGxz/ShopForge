declare global {
  interface Window { SHOPFORGE_API_BASE?: string; }
}

// Overridable at deploy time (GitHub Pages injects window.SHOPFORGE_API_BASE in index.html).
export const API_BASE = window.SHOPFORGE_API_BASE ?? 'http://localhost:5230';
export const API_URL = `${API_BASE}/api/v1`;
