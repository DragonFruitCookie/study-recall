"use client";

import { useTransition } from "react";
import { deleteTopic } from "@/app/actions";

/** Immediate delete (topic + its reviews), no confirmation. */
export function DeleteTopicButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Delete “${name}”`}
      disabled={pending}
      onClick={() => startTransition(() => deleteTopic(id))}
      className="ml-auto shrink-0 px-1 text-xs text-dim/50 transition hover:text-coral focus-visible:text-coral disabled:opacity-30"
    >
      ✕
    </button>
  );
}
