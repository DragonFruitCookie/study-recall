import { test } from "node:test";
import assert from "node:assert/strict";
import { sortTodos, type Todo } from "./todoOrder.ts";

const t = (id: string, created: string, completed: string | null = null): Todo => ({
  id, text: id, created_at: `2026-10-0${created}T10:00:00Z`, completed_at: completed && `2026-10-0${completed}T10:00:00Z`,
});

test("open todos in insertion order, checked ones at the bottom in check order", () => {
  const sorted = sortTodos([t("a", "1", "5"), t("b", "2"), t("c", "3", "4"), t("d", "1")]);
  assert.deepEqual(sorted.map((x) => x.id), ["d", "b", "c", "a"]);
});

test("unchecking moves a todo back to its original position", () => {
  const sorted = sortTodos([t("a", "1"), t("b", "2"), t("c", "3")]);
  assert.deepEqual(sorted.map((x) => x.id), ["a", "b", "c"]);
});

test("does not mutate input", () => {
  const input = [t("a", "2"), t("b", "1")];
  sortTodos(input);
  assert.deepEqual(input.map((x) => x.id), ["a", "b"]);
});
