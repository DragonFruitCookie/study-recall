import { appTimeZone, formatDate, todayInTz } from "@/lib/dates";
import { bucketReviews } from "@/lib/buckets";
import { fetchActiveReviews, fetchTopics, isDemo } from "@/lib/db";
import { AddTopicForm } from "@/components/AddTopicForm";
import { ReviewList } from "@/components/ReviewList";
import { TopicList } from "@/components/TopicList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tz = appTimeZone();
  const today = todayInTz(tz);
  const [active, topics] = await Promise.all([fetchActiveReviews(today), fetchTopics()]);
  const { backlog, today: todays } = bucketReviews(active, today, tz);
  const open = backlog.filter((r) => !r.completed_at).length + todays.filter((r) => !r.completed_at).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-dim uppercase">{formatDate(today)} · {tz}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Study<span className="text-mint">Recall</span>
        </h1>
        <p className="mt-2 text-sm text-dim">
          {open === 0 ? "Nothing waiting. Your brain thanks you ✦" : `${open} review${open === 1 ? "" : "s"} to go`}
        </p>
      </header>

      {isDemo() && (
        <p className="mb-4 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber">
          Demo mode — no Supabase configured, data is in memory and resets on restart.
        </p>
      )}
      <AddTopicForm today={today} />

      <div className="mt-10 space-y-10">
        {backlog.length > 0 && (
          <ReviewList title="Backlog" accent="coral" reviews={backlog} today={today} />
        )}
        <ReviewList title="Today" accent="mint" reviews={todays} today={today} emptyText="No reviews scheduled today." />
      </div>

      <TopicList topics={topics} today={today} />
    </main>
  );
}
