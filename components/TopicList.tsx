"use client";

import type { TopicWithReviews } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { REVIEW_OFFSETS } from "@/lib/schedule";
import { CategoryBadge } from "./CategoryBadge";
import { DeleteTopicButton } from "./DeleteTopicButton";

export function TopicList({ topics, today }: { topics: TopicWithReviews[]; today: string }) {
  if (topics.length === 0) return null;

  return (
    <details className="group mt-14 rounded-2xl border border-line/70 bg-panel/40">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs tracking-[0.2em] text-dim uppercase select-none hover:text-fg">
        <span className="inline-block transition group-open:rotate-90">›</span> All topics ({topics.length})
      </summary>
      <ul className="divide-y divide-line/60 border-t border-line/60">
        {topics.map((t) => (
          <li key={t.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2">
                  <span className="truncate text-sm">{t.name}</span>
                  {t.category && <CategoryBadge category={t.category} />}
                </p>
                <p className="text-xs text-dim">learned {formatDate(t.learned_on)}</p>
                {t.notes && <p className="mt-1 text-xs whitespace-pre-wrap text-dim/80">{t.notes}</p>}
              </div>
              <DeleteTopicButton
                id={t.id}
                name={t.name}
                triggerClassName="text-xs text-dim transition hover:text-coral focus-visible:text-coral disabled:opacity-40"
              >
                delete
              </DeleteTopicButton>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REVIEW_OFFSETS.map((_, i) => {
                const r = t.reviews.find((r) => r.review_number === i + 1);
                if (!r) {
                  return (
                    <span key={i} className="rounded-md border border-dashed border-line px-1.5 py-0.5 text-[11px] text-dim/60">
                      R{i + 1} pending
                    </span>
                  );
                }
                const state = r.completed_at ? "text-mint border-mint/30" : r.scheduled_on < today ? "text-coral border-coral/30" : r.scheduled_on === today ? "text-amber border-amber/30" : "text-dim border-line";
                return (
                  <span key={i} className={`rounded-md border px-1.5 py-0.5 text-[11px] ${state}`}>
                    R{r.review_number} {formatDate(r.scheduled_on)}
                    {r.completed_at && " ✓"}
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
