import "server-only";
import { createClient } from "@supabase/supabase-js";

// Shared Supabase plumbing for the review data (lib/db.ts) and the todo list (lib/todos.ts).

/** Without Supabase config in development, fall back to an in-memory demo store. */
export const demo = () => !process.env.SUPABASE_URL && process.env.NODE_ENV !== "production";

// Server-only client using Supabase's secret API key (sb_secret_...). This module
// imports "server-only", so it can never be bundled into client components.
export function db() {
  // Accept the API URL as copied from the dashboard, with or without /rest/v1
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  if (!key.startsWith("sb_secret_")) throw new Error("SUPABASE_SECRET_KEY must be a secret key (sb_secret_...)");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const isDemo = demo;

/** Supabase returns plain error objects; wrap them so messages show up properly. */
export function fail(error: { message: string; code?: string; hint?: string | null }): never {
  throw new Error(`Supabase${error.code ? ` ${error.code}` : ""}: ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
}
