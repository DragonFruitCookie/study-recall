"use client";

import { useOptimistic, useTransition } from "react";
import { setReviewDone } from "@/app/actions";
import type { Review } from "@/lib/buckets";
import { daysBetween, formatDate } from "@/lib/dates";
import { CategoryBadge } from "./CategoryBadge";

const accents = {
  coral: { text: "text-coral", dot: "bg-coral", ring: "border-coral/60", fill: "bg-coral" },
  mint: { text: "text-mint", dot: "bg-mint", ring: "border-mint/60", fill: "bg-mint" },
} as const;

const chip = ["", "text-mint bg-mint/10", "text-violet bg-violet/10", "text-amber bg-amber/10", "text-coral bg-coral/10"];

export function ReviewList({
  title,
  accent,
  reviews,
  today,
  emptyText,
}: {
  title: string;
  accent: keyof typeof accents;
  reviews: Review[];
  today: string;
  emptyText?: string;
}) {
  const a = accents[accent];
  const [, startTransition] = useTransition();
  const [items, toggle] = useOptimistic(reviews, (state, { id, done }: { id: string; done: boolean }) =>
    state.map((r) => (r.id === id ? { ...r, completed_at: done ? new Date().toISOString() : null } : r)),
  );
  const remaining = items.filter((r) => !r.completed_at).length;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
        <span className={`h-1.5 w-1.5 rounded-full ${a.dot} shadow-[0_0_8px_currentColor] ${a.text}`} />
        <span className={a.text}>{title}</span>
        <span className="text-dim">{remaining}/{items.length}</span>
      </h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-dim">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const done = !!r.completed_at;
            const late = daysBetween(r.scheduled_on, today);
            return (
              <li key={r.id}>
                <label
                  className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-panel/70 px-4 py-3 transition hover:border-line/0 hover:bg-panel ${done ? "opacity-45" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={done}
                    onChange={(e) => {
                      const next = e.target.checked;
                      startTransition(async () => {
                        toggle({ id: r.id, done: next });
                        const error = await setReviewDone(r.id, next);
                        if (error) alert(error);
                      });
                    }}
                  />
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-violet/50 ${
                      done ? `${a.fill} border-transparent` : `${a.ring} group-hover:scale-110`
                    }`}
                  >
                    {done && (
                      <svg viewBox="0 0 16 16" className="h-3 w-3 text-ink" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-[15px] ${done ? "line-through decoration-dim" : ""}`}>
                        {r.topic.name}
                      </span>
                      {r.topic.category && <CategoryBadge category={r.topic.category} />}
                    </span>
                    <span className="mt-0.5 block text-xs text-dim">
                      {late > 0 ? `due ${formatDate(r.scheduled_on)} · ${late}d late` : "due today"}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${chip[r.review_number]}`}>
                    R{r.review_number}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
