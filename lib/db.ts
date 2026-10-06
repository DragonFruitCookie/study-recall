import "server-only";
import { createClient } from "@supabase/supabase-js";
import { addDays, appTimeZone } from "./dates.ts";
import { firstReviewDate, planToggle, reconcile, type ScheduleChanges } from "./schedule.ts";
import type { Review } from "./buckets.ts";
import * as memory from "./memoryStore.ts";

/** Without Supabase config in development, fall back to an in-memory demo store. */
const demo = () => !process.env.SUPABASE_URL && process.env.NODE_ENV !== "production";

// Server-only client using Supabase's secret API key (sb_secret_...). This module
// imports "server-only", so it can never be bundled into client components.
function db() {
  // Accept the API URL as copied from the dashboard, with or without /rest/v1
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  if (!key.startsWith("sb_secret_")) throw new Error("SUPABASE_SECRET_KEY must be a secret key (sb_secret_...)");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const isDemo = demo;

/** Supabase returns plain error objects; wrap them so messages show up properly. */
function fail(error: { message: string; code?: string; hint?: string | null }): never {
  throw new Error(`Supabase${error.code ? ` ${error.code}` : ""}: ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
}

/**
 * Reviews that could appear on the todo list for `today`: everything due today
 * or earlier that is incomplete or was completed recently. Final bucketing
 * (timezone-exact) happens in bucketReviews.
 */
export async function fetchActiveReviews(today: string): Promise<Review[]> {
  if (demo()) return memory.activeReviews(today);
  const recent = `${addDays(today, -2)}T00:00:00Z`;
  const { data, error } = await db()
    .from("reviews")
    .select("id, review_number, scheduled_on, completed_at, topic:topics!inner(id, name, category)")
    .lte("scheduled_on", today)
    .or(`completed_at.is.null,completed_at.gte.${recent}`);
  if (error) fail(error);
  return data as unknown as Review[];
}

export type TopicWithReviews = {
  id: string;
  name: string;
  learned_on: string;
  created_at: string;
  category: string | null;
  notes: string | null;
  reviews: { review_number: number; scheduled_on: string; completed_at: string | null }[];
};

export async function fetchTopics(): Promise<TopicWithReviews[]> {
  if (demo()) return memory.topicsWithReviews();
  const { data, error } = await db()
    .from("topics")
    .select("id, name, learned_on, created_at, category, notes, reviews(review_number, scheduled_on, completed_at)")
    .order("learned_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) fail(error);
  return (data as TopicWithReviews[]).map((t) => ({
    ...t,
    reviews: [...t.reviews].sort((a, b) => a.review_number - b.review_number),
  }));
}

/** Topic + its first review, created atomically. Later reviews are created as earlier ones are completed. */
export async function createTopic(name: string, learnedOn: string, category: string, notes: string) {
  if (demo()) return void memory.createTopic(name, learnedOn, category, notes);
  const { error } = await db().rpc("create_topic_with_reviews", {
    p_name: name,
    p_learned_on: learnedOn,
    p_category: category,
    p_notes: notes,
    p_dates: [firstReviewDate(learnedOn)],
  });
  if (error) fail(error);
}

type Client = ReturnType<typeof db>;

async function applyChanges(client: Client, topicId: string, changes: ScheduleChanges) {
  if (changes.remove.length) {
    const { error } = await client.from("reviews").delete().in("id", changes.remove);
    if (error) fail(error);
  }
  for (const u of changes.update) {
    const { error } = await client.from("reviews").update({ scheduled_on: u.scheduled_on }).eq("id", u.id);
    if (error) fail(error);
  }
  if (changes.insert.length) {
    // unique (topic_id, review_number) + ignoreDuplicates: a double submit can't create duplicates
    const { error } = await client
      .from("reviews")
      .upsert(changes.insert.map((r) => ({ ...r, topic_id: topicId })), {
        onConflict: "topic_id,review_number",
        ignoreDuplicates: true,
      });
    if (error) fail(error);
  }
}

type TopicRows = { id: string; learned_on: string; reviews: { id: string; review_number: number; scheduled_on: string; completed_at: string | null }[] };
const TOPIC_ROWS = "id, learned_on, reviews(id, review_number, scheduled_on, completed_at)";

/**
 * Tick/untick a review, then recompute the topic's later review dates from the
 * actual completion date (see lib/schedule.ts). Throws a user-facing Error if not allowed.
 */
export async function setReviewCompleted(id: string, done: boolean) {
  if (demo()) return memory.setDone(id, done);
  const client = db();
  const { data: target, error: e1 } = await client.from("reviews").select("topic_id").eq("id", id).single();
  if (e1) fail(e1);
  const { data, error: e2 } = await client.from("topics").select(TOPIC_ROWS).eq("id", target.topic_id).single();
  if (e2) fail(e2);
  const topic = data as TopicRows;

  const plan = planToggle(topic.learned_on, topic.reviews, id, done, new Date(), appTimeZone());
  const { error } = await client.from("reviews").update({ completed_at: plan.completedAt }).eq("id", id);
  if (error) fail(error);
  await applyChanges(client, topic.id, plan.changes);
}

/** Bring every topic's review rows in line with the scheduling rules (one-off migration). */
export async function rescheduleAll(dryRun = false): Promise<{ topics: number; changed: number }> {
  const client = db();
  const { data, error } = await client.from("topics").select(TOPIC_ROWS);
  if (error) fail(error);
  let changed = 0;
  for (const topic of data as TopicRows[]) {
    const changes = reconcile(topic.learned_on, topic.reviews, appTimeZone());
    const n = changes.insert.length + changes.update.length + changes.remove.length;
    if (n) {
      if (dryRun) console.log(topic.id, JSON.stringify(changes));
      else await applyChanges(client, topic.id, changes);
      changed += n;
    }
  }
  return { topics: data.length, changed };
}

export async function removeTopic(id: string) {
  if (demo()) return memory.removeTopic(id);
  const { error } = await db().from("topics").delete().eq("id", id); // reviews cascade
  if (error) fail(error);
}
