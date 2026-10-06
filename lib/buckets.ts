import { dateInTz } from "./dates.ts";

export type Review = {
  id: string;
  review_number: number;
  scheduled_on: string; // YYYY-MM-DD
  completed_at: string | null; // ISO timestamp
  topic: { id: string; name: string; category: string | null };
};

/**
 * Derive BACKLOG / TODAY from scheduled date + completion state. Nothing derived
 * is stored.
 *  - TODAY:   scheduled today (done or not).
 *  - BACKLOG: scheduled before today and not done, plus backlog items completed
 *             today (so they stay visible, crossed out, until tomorrow).
 * Incomplete items first, completed ones sink to the bottom.
 */
export function bucketReviews(reviews: Review[], today: string, timeZone: string) {
  const backlog: Review[] = [];
  const todays: Review[] = [];

  for (const r of reviews) {
    if (r.scheduled_on === today) todays.push(r);
    else if (r.scheduled_on < today) {
      if (!r.completed_at || dateInTz(new Date(r.completed_at), timeZone) === today) backlog.push(r);
    }
  }

  const order = (a: Review, b: Review) => {
    if (!!a.completed_at !== !!b.completed_at) return a.completed_at ? 1 : -1;
    if (a.completed_at && b.completed_at) return a.completed_at.localeCompare(b.completed_at);
    return (
      a.scheduled_on.localeCompare(b.scheduled_on) ||
      a.topic.name.localeCompare(b.topic.name) ||
      a.review_number - b.review_number
    );
  };

  return { backlog: backlog.sort(order), today: todays.sort(order) };
}
