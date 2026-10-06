"use server";

// Server actions for the standalone todo list (separate from the review actions).
import { revalidatePath } from "next/cache";
import { createTodo, removeTodo, setTodoCompleted } from "@/lib/todos";

/** Each action returns a user-facing error message, or null on success. */
async function run(fn: () => Promise<void>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  } finally {
    revalidatePath("/");
  }
}

export async function addTodo(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "Write something first.";
  return run(() => createTodo(trimmed));
}

export async function toggleTodo(id: string, done: boolean) {
  return run(() => setTodoCompleted(id, done));
}

export async function deleteTodo(id: string) {
  return run(() => removeTodo(id));
}
