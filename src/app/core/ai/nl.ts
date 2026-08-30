const NL = /\b(best|under|for|gaming|laptop|build|recommend|cheap|budget|عايز|ابي|أفضل|تحت|تجميعة|لابتوب)\b/i;

export function looksLikeNaturalLanguage(q: string): boolean {
  const t = q.trim();
  if (t.length < 12) return false;
  return t.split(/\s+/).length >= 4 || NL.test(t);
}
