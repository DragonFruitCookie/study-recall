import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSchedule, firstReviewDate, planToggle, reconcile, type ScheduleRow } from "./schedule.ts";

const TZ = "UTC";
const at = (date: string) => `${date}T10:00:00Z`;

test("new topic: only R1 is scheduled, learned + 1", () => {
  assert.equal(firstReviewDate("2026-09-01"), "2026-09-02");
  assert.deepEqual(computeSchedule("2026-09-01", [], TZ), ["2026-09-02", null, null, null]);
});

test("each review is scheduled from the previous completion date (spec example)", () => {
  assert.deepEqual(
    computeSchedule("2026-09-01", [at("2026-09-04"), at("2026-09-12"), at("2026-09-30")], TZ),
    ["2026-09-02", "2026-09-11", "2026-09-28", "2026-11-04"],
  );
});

test("on-time and early completions also anchor the next review", () => {
  assert.deepEqual(computeSchedule("2026-09-01", [at("2026-09-02")], TZ).slice(0, 2), ["2026-09-02", "2026-09-09"]);
  assert.deepEqual(computeSchedule("2026-09-01", [at("2026-09-01")], TZ).slice(0, 2), ["2026-09-02", "2026-09-08"]);
});

test("completion date is taken in the app timezone", () => {
  // 20:00 UTC on Sep 3 is already Sep 4 in Kolkata
  assert.equal(computeSchedule("2026-09-01", ["2026-09-03T20:00:00Z"], "Asia/Kolkata")[1], "2026-09-11");
  assert.equal(computeSchedule("2026-09-01", ["2026-09-03T20:00:00Z"], "UTC")[1], "2026-09-10");
});

test("chain stops at the first incomplete review", () => {
  // R2 completion is ignored when R1 isn't done (inconsistent input)
  assert.deepEqual(computeSchedule("2026-09-01", [null, at("2026-09-12")], TZ), ["2026-09-02", null, null, null]);
});

const row = (n: number, scheduled_on: string, completed_at: string | null = null): ScheduleRow => ({
  id: `r${n}`, review_number: n, scheduled_on, completed_at,
});

test("completing R1 late creates R2 from the completion date", () => {
  const plan = planToggle("2026-09-01", [row(1, "2026-09-02")], "r1", true, new Date(at("2026-09-04")), TZ);
  assert.equal(plan.completedAt, new Date(at("2026-09-04")).toISOString());
  assert.deepEqual(plan.changes, { insert: [{ review_number: 2, scheduled_on: "2026-09-11" }], update: [], remove: [] });
});

test("unticking removes the not-yet-done next review", () => {
  const rows = [row(1, "2026-09-02", at("2026-09-04")), row(2, "2026-09-11")];
  const plan = planToggle("2026-09-01", rows, "r1", false, new Date(), TZ);
  assert.equal(plan.completedAt, null);
  assert.deepEqual(plan.changes, { insert: [], update: [], remove: ["r2"] });
});

test("re-ticking keeps the original completion timestamp", () => {
  const rows = [row(1, "2026-09-02", at("2026-09-04")), row(2, "2026-09-11")];
  const plan = planToggle("2026-09-01", rows, "r1", true, new Date(at("2026-09-20")), TZ);
  assert.equal(plan.completedAt, at("2026-09-04"));
  assert.deepEqual(plan.changes, { insert: [], update: [], remove: [] });
});

test("cannot untick a review when a later one is done", () => {
  const rows = [row(1, "2026-09-02", at("2026-09-04")), row(2, "2026-09-11", at("2026-09-11")), row(3, "2026-09-27")];
  assert.throws(() => planToggle("2026-09-01", rows, "r1", false, new Date(), TZ), /Untick that one first/);
});

test("completing R4 schedules nothing further", () => {
  const rows = [
    row(1, "2026-09-02", at("2026-09-02")),
    row(2, "2026-09-09", at("2026-09-09")),
    row(3, "2026-09-25", at("2026-09-25")),
    row(4, "2026-10-30"),
  ];
  const plan = planToggle("2026-09-01", rows, "r4", true, new Date(at("2026-11-02")), TZ);
  assert.deepEqual(plan.changes, { insert: [], update: [], remove: [] });
});

test("reconcile migrates old fixed-schedule rows", () => {
  // Old model: all four rows created up front, anchored to learned date; R1 done late.
  const rows = [row(1, "2026-09-02", at("2026-09-04")), row(2, "2026-09-08"), row(3, "2026-09-17"), row(4, "2026-10-06")];
  assert.deepEqual(reconcile("2026-09-01", rows, TZ), {
    insert: [],
    update: [{ id: "r2", scheduled_on: "2026-09-11" }],
    remove: ["r3", "r4"],
  });
});
