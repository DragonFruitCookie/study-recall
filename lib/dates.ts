// All "calendar dates" in the app are plain YYYY-MM-DD strings. They are never
// converted to Date objects in local time, so they can't drift across timezones.

export const REVIEW_OFFSETS = [1, 7, 16, 35] as const;

export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || "UTC";
}

/** Calendar date (YYYY-MM-DD) of an instant, as seen in the given timezone. */
export function dateInTz(instant: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function todayInTz(timeZone: string, now: Date = new Date()): string {
  return dateInTz(now, timeZone);
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Pure calendar arithmetic, done in UTC so DST never matters. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Review dates, always anchored to the original learned date. */
export function reviewSchedule(learnedOn: string): { reviewNumber: number; scheduledOn: string }[] {
  return REVIEW_OFFSETS.map((offset, i) => ({
    reviewNumber: i + 1,
    scheduledOn: addDays(learnedOn, offset),
  }));
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}
