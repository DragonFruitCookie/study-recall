// Spaced-repetition scheduling. Pure functions only: no I/O, no clock, so the
// rules are fully testable.
//
//   R1 = learned date + 1
//   R2 = date R1 was completed + 7
//   R3 = date R2 was completed + 16
//   R4 = date R3 was completed + 35
//
// A review only exists (has a row) once its date is known, i.e. once the
// previous review is done. "Completion date" is the calendar date in the app timezone.
import { addDays, dateInTz } from "./dates.ts";

export const REVIEW_OFFSETS = [1, 7, 16, 35] as const;

export type ScheduleRow = {
  id: string;
  review_number: number;
  scheduled_on: string;
  completed_at: string | null;
};

/**
 * Scheduled date for each review number (index 0 = R1), given completion
 * timestamps by review number. `null` = not scheduled yet (previous not done).
 */
export function computeSchedule(
  learnedOn: string,
  completedAt: (string | null | undefined)[],
  timeZone: string,
): (string | null)[] {
  const schedule: (string | null)[] = [];
  let anchor: string | null = learnedOn;
  REVIEW_OFFSETS.forEach((offset, i) => {
    const scheduled: string | null = anchor ? addDays(anchor, offset) : null;
    schedule.push(scheduled);
    const done = completedAt[i];
    anchor = scheduled && done ? dateInTz(new Date(done), timeZone) : null;
  });
  return schedule;
}

export type ScheduleChanges = {
  insert: { review_number: number; scheduled_on: string }[];
  update: { id: string; scheduled_on: string }[];
  remove: string[];
};

/** Diff a topic's existing review rows against the schedule they imply. */
export function reconcile(learnedOn: string, rows: ScheduleRow[], timeZone: string): ScheduleChanges {
  const byNumber = new Map(rows.map((r) => [r.review_number, r]));
  const schedule = computeSchedule(
    learnedOn,
    REVIEW_OFFSETS.map((_, i) => byNumber.get(i + 1)?.completed_at),
    timeZone,
  );
  const changes: ScheduleChanges = { insert: [], update: [], remove: [] };
  schedule.forEach((date, i) => {
    const row = byNumber.get(i + 1);
    if (date && !row) changes.insert.push({ review_number: i + 1, scheduled_on: date });
    else if (date && row && row.scheduled_on !== date) changes.update.push({ id: row.id, scheduled_on: date });
    // Never discard a completed review, even if the data is inconsistent.
    else if (!date && row && !row.completed_at) changes.remove.push(row.id);
  });
  return changes;
}

/**
 * Tick/untick one review: returns its new completion timestamp and the schedule
 * changes that follow from it. Throws (with a user-facing message) if not allowed.
 */
export function planToggle(
  learnedOn: string,
  rows: ScheduleRow[],
  id: string,
  done: boolean,
  now: Date,
  timeZone: string,
): { completedAt: string | null; changes: ScheduleChanges } {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error("Review not found.");
  if (!done && rows.some((r) => r.review_number > row.review_number && r.completed_at)) {
    throw new Error(`Review ${row.review_number + 1} of this topic is already done. Untick that one first.`);
  }
  const completedAt = done ? (row.completed_at ?? now.toISOString()) : null;
  const updated = rows.map((r) => (r.id === id ? { ...r, completed_at: completedAt } : r));
  return { completedAt, changes: reconcile(learnedOn, updated, timeZone) };
}

/** Date of the first review for a new topic. */
export function firstReviewDate(learnedOn: string): string {
  return addDays(learnedOn, REVIEW_OFFSETS[0]);
}
