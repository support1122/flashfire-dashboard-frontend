import type { Job } from "../types";

/**
 * Jobs the end client created themselves (dashboard), as opposed to operations
 * or extension/system flows. Used for timeline copy and ops-only remove confirm.
 */
export function isUserOriginatedJob(job: Job | null | undefined): boolean {
  if (!job) return false;
  if (job.createdByRole === "user") return true;
  if (job.createdByRole === "operations") return false;

  const first = job.timeline?.[0];
  if (first && String(first).toLowerCase() === "added by user") return true;

  const addedBy = job.addedBy?.trim();
  if (addedBy) return false;

  const opName = String((job as { operatorName?: string }).operatorName || "").toLowerCase();
  if (opName === "user" || opName === "") return true;

  return false;
}
