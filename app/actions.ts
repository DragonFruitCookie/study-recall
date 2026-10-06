"use server";

import { revalidatePath } from "next/cache";
import { createTopic, removeTopic, setReviewCompleted } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export async function addTopic(_prev: string | null, form: FormData): Promise<string | null> {
  const name = String(form.get("name") ?? "").trim();
  const learnedOn = String(form.get("learned_on") ?? "");
  const category = String(form.get("category") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  if (!name) return "Give the topic a name.";
  if (!isValidDate(learnedOn)) return "Pick a valid learned date.";

  try {
    await createTopic(name, learnedOn, category, notes);
  } catch (e) {
    return `Couldn't save: ${e instanceof Error ? e.message : String(e)}`;
  }
  revalidatePath("/");
  return null;
}

export async function setReviewDone(id: string, done: boolean) {
  await setReviewCompleted(id, done);
  revalidatePath("/");
}

export async function deleteTopic(id: string) {
  await removeTopic(id);
  revalidatePath("/");
}
