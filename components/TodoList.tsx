"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { addTodo, deleteTodo, toggleTodo } from "@/app/todoActions";
import { sortTodos, type Todo } from "@/lib/todoOrder";

type Change =
  | { type: "add"; todo: Todo }
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string };

export function TodoList({ todos, loadError }: { todos: Todo[]; loadError?: string }) {
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, apply] = useOptimistic(todos, (state, c: Change) => {
    if (c.type === "add") return [...state, c.todo];
    if (c.type === "delete") return state.filter((t) => t.id !== c.id);
    return state.map((t) => (t.id === c.id ? { ...t, completed_at: c.done ? new Date().toISOString() : null } : t));
  });
  const sorted = sortTodos(items);
  const remaining = sorted.filter((t) => !t.completed_at).length;

  const mutate = (change: Change, action: () => Promise<string | null>) =>
    startTransition(async () => {
      apply(change);
      const error = await action();
      if (error) alert(error);
    });

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-amber text-amber shadow-[0_0_8px_currentColor]" />
        <span className="text-amber">Todo</span>
        <span className="text-dim">{remaining}/{sorted.length}</span>
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = inputRef.current?.value.trim() ?? "";
          if (!text) return;
          inputRef.current!.value = "";
          const now = new Date().toISOString();
          mutate({ type: "add", todo: { id: `tmp-${now}`, text, completed_at: null, created_at: now } }, () => addTodo(text));
        }}
        className="mb-3 flex gap-2"
      >
        <input
          ref={inputRef}
          placeholder="Add a todo…"
          autoComplete="off"
          className="w-full rounded-lg border border-line bg-panel/70 px-3 py-2 text-sm placeholder:text-dim/60 outline-none transition focus:border-amber/50 focus:ring-2 focus:ring-amber/10"
        />
        <button className="shrink-0 rounded-lg bg-amber/10 px-3 text-sm text-amber ring-1 ring-amber/25 transition hover:bg-amber/20">
          Add
        </button>
      </form>

      {loadError ? (
        <p className="rounded-xl border border-dashed border-coral/40 px-4 py-4 text-xs text-coral">
          Couldn&apos;t load todos: {loadError}
        </p>
      ) : sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-dim">Nothing on your plate.</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map((t) => {
            const done = !!t.completed_at;
            const temp = t.id.startsWith("tmp-");
            return (
              <li
                key={t.id}
                className={`group flex items-center gap-3 rounded-lg border border-line/70 bg-panel/50 px-3 py-2 transition hover:bg-panel ${done ? "opacity-45" : ""}`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={done}
                    disabled={temp}
                    onChange={(e) => {
                      const next = e.target.checked;
                      mutate({ type: "toggle", id: t.id, done: next }, () => toggleTodo(t.id, next));
                    }}
                  />
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-amber/40 ${
                      done ? "border-transparent bg-amber" : "border-amber/50"
                    }`}
                  >
                    {done && (
                      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-ink" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`min-w-0 flex-1 text-sm break-words ${done ? "line-through decoration-dim" : ""}`}>{t.text}</span>
                </label>
                <button
                  type="button"
                  aria-label={`Delete “${t.text}”`}
                  disabled={temp}
                  onClick={() => mutate({ type: "delete", id: t.id }, () => deleteTodo(t.id))}
                  className="shrink-0 px-1 text-dim/50 transition group-hover:text-dim hover:!text-coral focus-visible:text-coral disabled:opacity-0"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
