"use server";

import { revalidatePath } from "next/cache";
import {
  clockOutLatestEntry as clockOutLatestEntryMutation,
  createClockInEntry as createClockInEntryMutation,
} from "@/lib/db/mutations";

type ClockInInput = {
  employeeId: string;
  jobId: string;
  jobPhaseId?: string;
};

export async function createClockInEntryAction(input: ClockInInput) {
  const result = await createClockInEntryMutation(input);

  if (!result.error) {
    revalidatePath("/dashboard/time");
  }

  return result;
}

export async function clockOutLatestEntryAction(input: { employeeId: string; jobId?: string }) {
  const result = await clockOutLatestEntryMutation(input);

  if (!result.error) {
    revalidatePath("/dashboard/time");
  }

  return result;
}
