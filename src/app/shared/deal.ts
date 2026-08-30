/** Deterministic deal end ~2–5 days from a stable epoch, keyed by slug so it never jumps on reload. */
export function dealEndsAt(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const days = 2 + (Math.abs(h) % 4);
  const hours = Math.abs(h >> 3) % 24;
  const start = Date.UTC(2026, 7, 31, 0, 0, 0);
  return start + days * 86400000 + hours * 3600000;
}

export function dealLabel(slug: string, now = Date.now()): string | null {
  const left = dealEndsAt(slug) - now;
  if (left <= 0) return null;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
