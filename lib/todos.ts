import "server-only";
import { db, demo, fail } from "./supabase.ts";
import { sortTodos, type Todo } from "./todoOrder.ts";

// Standalone todo list. Deliberately shares nothing with topics/reviews except
// the Supabase client.

// In-memory fallback for demo mode (no Supabase configured in `next dev`).
const g = globalThis as unknown as { __studyrecallTodos?: Todo[] };
const mem = () => (g.__studyrecallTodos ??= []);

export async function fetchTodos(): Promise<Todo[]> {
  if (demo()) return sortTodos(mem());
  const { data, error } = await db().from("todos").select("id, text, completed_at, created_at");
  if (error) fail(error);
  return sortTodos(data as Todo[]);
}

export async function createTodo(text: string) {
  if (demo()) return void mem().push({ id: crypto.randomUUID(), text, completed_at: null, created_at: new Date().toISOString() });
  const { error } = await db().from("todos").insert({ text });
  if (error) fail(error);
}

export async function setTodoCompleted(id: string, done: boolean) {
  const completed_at = done ? new Date().toISOString() : null;
  if (demo()) {
    const todo = mem().find((t) => t.id === id);
    if (todo) todo.completed_at = completed_at;
    return;
  }
  const { error } = await db().from("todos").update({ completed_at }).eq("id", id);
  if (error) fail(error);
}

export async function removeTodo(id: string) {
  if (demo()) return void (g.__studyrecallTodos = mem().filter((t) => t.id !== id));
  const { error } = await db().from("todos").delete().eq("id", id);
  if (error) fail(error);
}
