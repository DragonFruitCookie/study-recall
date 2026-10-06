// In-memory stand-in for Supabase, used only in `next dev` when SUPABASE_URL is
// unset, so the UI can be tried without a database. Data resets on restart.
import { addDays, appTimeZone, reviewSchedule, todayInTz } from "./dates.ts";

type Topic = { id: string; name: string; learned_on: string; category: string | null; notes: string | null; created_at: string };
type Row = { id: string; topic_id: string; review_number: number; scheduled_on: string; completed_at: string | null };

const g = globalThis as unknown as { __studyrecall?: { topics: Topic[]; reviews: Row[] } };

function store() {
  if (!g.__studyrecall) {
    g.__studyrecall = { topics: [], reviews: [] };
    const today = todayInTz(appTimeZone());
    const seed: [string, number, string | null, number[]][] = [
      // name, learned N days ago, category, review numbers already completed
      ["Krebs cycle", 1, "Biology", []],
      ["Eigenvalues & eigenvectors", 7, "Linear algebra", [1]],
      ["French subjunctive", 9, "Languages", []],
      ["TCP congestion control", 16, "Networking", [1]],
      ["Bayes' theorem", 35, "Statistics", [1, 2, 3]],
      ["React Server Components", 3, "Web dev", []],
    ];
    for (const [name, ago, category, done] of seed) {
      const id = createTopic(name, addDays(today, -ago), category ?? "", "");
      for (const r of g.__studyrecall.reviews) {
        if (r.topic_id === id && done.includes(r.review_number)) r.completed_at = `${r.scheduled_on}T12:00:00Z`;
      }
    }
  }
  return g.__studyrecall;
}

export function createTopic(name: string, learnedOn: string, category: string, notes: string) {
  const s = g.__studyrecall ?? store();
  const id = crypto.randomUUID();
  s.topics.push({ id, name, learned_on: learnedOn, category: category || null, notes: notes || null, created_at: new Date().toISOString() });
  for (const r of reviewSchedule(learnedOn)) {
    s.reviews.push({ id: crypto.randomUUID(), topic_id: id, review_number: r.reviewNumber, scheduled_on: r.scheduledOn, completed_at: null });
  }
  return id;
}

export function setDone(id: string, done: boolean) {
  const r = store().reviews.find((r) => r.id === id);
  if (r) r.completed_at = done ? new Date().toISOString() : null;
}

export function removeTopic(id: string) {
  const s = store();
  s.topics = s.topics.filter((t) => t.id !== id);
  s.reviews = s.reviews.filter((r) => r.topic_id !== id);
}

export function activeReviews(today: string) {
  const s = store();
  return s.reviews
    .filter((r) => r.scheduled_on <= today)
    .map((r) => {
      const t = s.topics.find((t) => t.id === r.topic_id)!;
      return { id: r.id, review_number: r.review_number, scheduled_on: r.scheduled_on, completed_at: r.completed_at, topic: { id: t.id, name: t.name, category: t.category } };
    });
}

export function topicsWithReviews() {
  const s = store();
  return [...s.topics]
    .sort((a, b) => b.learned_on.localeCompare(a.learned_on) || b.created_at.localeCompare(a.created_at))
    .map((t) => ({
      ...t,
      reviews: s.reviews.filter((r) => r.topic_id === t.id).sort((a, b) => a.review_number - b.review_number),
    }));
}
