import type { TopicWithReviews } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { CategoryBadge } from "./CategoryBadge";
import { DeleteTopicButton } from "./DeleteTopicButton";

/** Topics logged today (by when they were added, in the app timezone). Collapsed by default. */
export function FreshToday({
  topics,
  today,
}: {
  topics: TopicWithReviews[];
  today: string;
}) {
  return (
    <details className="group mt-3 rounded-xl border border-line/60 bg-panel/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs text-dim select-none hover:text-fg [&::-webkit-details-marker]:hidden">
        <span className="inline-block w-2 text-violet transition-transform group-open:rotate-90">
          ›
        </span>
        <span className="tracking-[0.2em] uppercase">Studied Today</span>
        <span className="text-dim/70">{topics.length}</span>
      </summary>
      {topics.length === 0 ? (
        <p className="border-t border-line/50 px-4 py-3 text-xs text-dim/70">
          Nothing logged yet today.
        </p>
      ) : (
        <ul className="space-y-1 border-t border-line/50 px-4 py-3">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span className="h-1 w-1 shrink-0 rounded-full bg-violet/70" />
              <span className="truncate">{t.name}</span>
              {t.category && <CategoryBadge category={t.category} />}
              {t.learned_on !== today && (
                <span className="shrink-0 text-xs text-dim">learned {formatDate(t.learned_on)}</span>
              )}
              <DeleteTopicButton id={t.id} name={t.name} />
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
