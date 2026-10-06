import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_STYLES, categoryStyle } from "./categoryColor.ts";

test("same category always gets the same style, ignoring case/whitespace", () => {
  assert.equal(categoryStyle("DSA"), categoryStyle(" dsa "));
  assert.ok(CATEGORY_STYLES.includes(categoryStyle("Biology") as (typeof CATEGORY_STYLES)[number]));
});

test("categories spread across the palette", () => {
  const used = new Set(["DSA", "Biology", "Networking", "Statistics", "Languages", "Web dev", "Maths", "History"].map(categoryStyle));
  assert.ok(used.size >= 3);
});
