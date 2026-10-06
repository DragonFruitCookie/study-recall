// Muted accent per category. Same category (case/whitespace-insensitive) → same color everywhere.
// Class strings are spelled out in full so Tailwind can see them.
export const CATEGORY_STYLES = [
  "text-violet/90 bg-violet/10 ring-violet/20",
  "text-mint/90 bg-mint/10 ring-mint/20",
  "text-sky/90 bg-sky/10 ring-sky/20",
  "text-amber/90 bg-amber/10 ring-amber/20",
  "text-coral/90 bg-coral/10 ring-coral/20",
] as const;

export function categoryStyle(category: string): string {
  const key = category.trim().toLowerCase();
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return CATEGORY_STYLES[h % CATEGORY_STYLES.length];
}
