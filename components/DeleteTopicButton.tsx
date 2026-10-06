"use client";

import { useTransition, type ReactNode } from "react";
import { deleteTopic } from "@/app/actions";
import { ConfirmDelete } from "./ConfirmDelete";

/** Deletes a topic + its reviews after an in-app confirmation. */
export function DeleteTopicButton({
  id,
  name,
  className,
  triggerClassName = "px-1 text-xs text-dim/50 transition hover:text-coral focus-visible:text-coral disabled:opacity-30",
  children = "✕",
}: {
  id: string;
  name: string;
  className?: string;
  triggerClassName?: string;
  children?: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <ConfirmDelete
      ariaLabel={`Delete “${name}”`}
      disabled={pending}
      className={`shrink-0 ${className ?? ""}`}
      triggerClassName={triggerClassName}
      onConfirm={() => startTransition(() => deleteTopic(id))}
      message={
        <>
          Delete <span className="font-medium text-fg">“{name}”</span> and its whole review schedule?
        </>
      }
    >
      {children}
    </ConfirmDelete>
  );
}
