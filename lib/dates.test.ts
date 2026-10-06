import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewSchedule, addDays, dateInTz, isValidDate } from "./dates.ts";
import { bucketReviews, type Review } from "./buckets.ts";

test("schedule anchored to learned date", () => {
  assert.deepEqual(
    reviewSchedule("2026-09-01").map((r) => r.scheduledOn),
    ["2026-09-02", "2026-09-08", "2026-09-17", "2026-10-06"],
  );
});

test("addDays across month/year/leap boundaries", () => {
  assert.equal(addDays("2027-12-31", 1), "2028-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-03-07", 1), "2026-03-08"); // US DST weekend
});

test("timezone-aware today", () => {
  const instant = new Date("2026-10-06T02:00:00Z");
  assert.equal(dateInTz(instant, "America/Los_Angeles"), "2026-10-05");
  assert.equal(dateInTz(instant, "Asia/Kolkata"), "2026-10-06");
});

test("date validation", () => {
  assert.ok(isValidDate("2026-02-28"));
  assert.ok(!isValidDate("2026-02-30"));
  assert.ok(!isValidDate("06/10/2026"));
});

const mk = (id: string, scheduled_on: string, completed_at: string | null = null): Review => ({
  id, review_number: 1, scheduled_on, completed_at,
  topic: { id: "t" + id, name: "Topic " + id, category: null },
});

test("bucketing", () => {
  const today = "2026-10-06";
  const { backlog, today: todays } = bucketReviews(
    [
      mk("a", "2026-10-06", "2026-10-06T08:00:00Z"), // today, done → bottom
      mk("b", "2026-10-06"), // today, open
      mk("c", "2026-10-01"), // missed → backlog
      mk("d", "2026-10-02", "2026-10-06T09:00:00Z"), // backlog done today → visible, bottom
      mk("e", "2026-10-02", "2026-10-03T09:00:00Z"), // done long ago → hidden
      mk("f", "2026-10-07"), // future → hidden
    ],
    today,
    "UTC",
  );
  assert.deepEqual(backlog.map((r) => r.id), ["c", "d"]);
  assert.deepEqual(todays.map((r) => r.id), ["b", "a"]);
});
