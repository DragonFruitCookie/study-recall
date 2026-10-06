"use client";

import { useTransition } from "react";
import { deleteTopic } from "@/app/actions";
import type { TopicWithReviews } from "@/lib/db";
import { formatDate } from "@/lib/dates";

export function TopicList({ topics, today }: { topics: TopicWithReviews[]; today: string }) {
  const [pending, startTransition] = useTransition();
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
                <p className="truncate text-sm">{t.name}</p>
                <p className="text-xs text-dim">
                  learned {formatDate(t.learned_on)}
                  {t.category && <> · {t.category}</>}
                </p>
                {t.notes && <p className="mt-1 text-xs whitespace-pre-wrap text-dim/80">{t.notes}</p>}
              </div>
              <button
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete “${t.name}” and all its reviews?`)) startTransition(() => deleteTopic(t.id));
                }}
                className="shrink-0 text-xs text-dim transition hover:text-coral disabled:opacity-40"
              >
                delete
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.reviews.map((r) => {
                const state = r.completed_at ? "text-mint border-mint/30" : r.scheduled_on < today ? "text-coral border-coral/30" : r.scheduled_on === today ? "text-amber border-amber/30" : "text-dim border-line";
                return (
                  <span key={r.review_number} className={`rounded-md border px-1.5 py-0.5 text-[11px] ${state}`}>
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
