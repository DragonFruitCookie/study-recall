"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTopic } from "@/app/actions";

const field =
  "w-full rounded-lg border border-line bg-ink/60 px-3 py-2 text-sm placeholder:text-dim/60 outline-none transition focus:border-violet/60 focus:ring-2 focus:ring-violet/15";

export function AddTopicForm({ today }: { today: string }) {
  const [error, action, pending] = useActionState(addTopic, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Reset after a successful save
  useEffect(() => {
    if (submitted.current && !pending && !error) {
      formRef.current?.reset();
    }
    if (!pending) submitted.current = false;
  }, [pending, error]);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => (submitted.current = true)}
      className="rounded-2xl border border-line bg-panel/80 p-4 shadow-[0_0_40px_-20px_rgb(179_157_255/0.35)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="name" required placeholder="What did you learn?" className={field} autoComplete="off" />
        <input name="learned_on" type="date" required defaultValue={today} max={today} className={`${field} sm:w-40`} />
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input name="category" placeholder="Category" className={`${field} sm:w-40`} autoComplete="off" />
        {/* Starts one line tall, grows with content */}
        <textarea
          name="notes"
          placeholder="Notes"
          rows={1}
          className={`${field} max-h-32 min-h-[38px] resize-none field-sizing-content`}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          disabled={pending}
          className="rounded-lg bg-violet/15 px-4 py-1.5 text-sm font-medium text-violet ring-1 ring-violet/30 transition hover:bg-violet/25 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add topic"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </form>
  );
}
