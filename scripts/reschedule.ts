// One-off: recompute every topic's review rows with the dynamic schedule.
// Safe to re-run (only changes rows that differ).
// Usage: npm run reschedule            (apply)
//        npm run reschedule -- --dry-run (preview only)
import { rescheduleAll } from "../lib/db.ts";

const dryRun = process.argv.includes("--dry-run");
const { topics, changed } = await rescheduleAll(dryRun);
console.log(`Checked ${topics} topic(s), ${dryRun ? "would apply" : "applied"} ${changed} review change(s).`);
