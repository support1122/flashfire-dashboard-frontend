export function getTimeAgo(dateString: string): string {
  if (!dateString || typeof dateString !== "string") return "N/A";

  try {
    const parts = dateString.trim().split(",");
    if (parts.length < 2) return "N/A";

    const datePart = parts[0].trim();                // "08/12/2025" or "12/08/2025"
    const timePartRaw = parts.slice(1).join(",").trim(); // "06:09 PM", "06:09:05 PM IST", etc.

    // Parse date numbers
    const [a, b, yStr] = datePart.split("/").map(s => s.trim());
    let A = Number(a), B = Number(b), Y = Number(yStr);
    if (!A || !B || !Y) return "N/A";
    if (Y < 100) Y += 2000; // guard 2-digit years

    // Parse time as 24h parts
    const t = to24HourParts(timePartRaw);
    if (!t) return "N/A";

    // Build two hypotheses: A/B/Y could be M/D/Y or D/M/Y
    const candidateMDY = new Date(Y, A - 1, B, t.h, t.m, t.s || 0);
    const candidateDMY = new Date(Y, B - 1, A, t.h, t.m, t.s || 0);

    const now = new Date();

    // Choose the candidate that is in the past and closest to now.
    const diffMDY = now.getTime() - candidateMDY.getTime();
    const diffDMY = now.getTime() - candidateDMY.getTime();

    let chosen = candidateMDY;
    if (isNaN(candidateMDY.getTime()) && !isNaN(candidateDMY.getTime())) {
      chosen = candidateDMY;
    } else if (!isNaN(candidateMDY.getTime()) && !isNaN(candidateDMY.getTime())) {
      const pastMDY = diffMDY >= 0;
      const pastDMY = diffDMY >= 0;
      if (pastMDY && pastDMY) {
        // both in past: pick the closer one
        chosen = Math.abs(diffMDY) <= Math.abs(diffDMY) ? candidateMDY : candidateDMY;
      } else if (pastMDY && !pastDMY) {
        chosen = candidateMDY;
      } else if (!pastMDY && pastDMY) {
        chosen = candidateDMY;
      } else {
        // both future (weird clock or bad data): pick closer, then clamp to "now"
        chosen = Math.abs(diffMDY) <= Math.abs(diffDMY) ? candidateMDY : candidateDMY;
      }
    }

    let diffMs = now.getTime() - chosen.getTime();
    if (diffMs < 0) diffMs = 0; // clamp tiny future diffs

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

    if (diffSec < 60) return "Added Now";
    if (diffMin < 60) return `Added ${plural(diffMin, "Minute")} Ago`;
    if (diffHr  < 24) return `Added ${plural(diffHr, "Hour")} Ago`;
    return `Added ${plural(diffDay, "Day")} Ago`;
  } catch {
    return "N/A";
  }
}

/** Robust 12h → 24h parser.
 * Accepts "6:09 PM", "06:09:05 pm", "6:09pm", "06:09 PM IST", etc.
 */
function to24HourParts(input: string): { h: number; m: number; s: number } | null {
  if (!input) return null;
  const s = input.replace(/\s+/g, " ").trim().toUpperCase();

  // Grab hh:mm[:ss] + AM/PM, ignore trailing zone labels
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/);
  if (!m) return null;

  let h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] ? Number(m[3]) : 0;
  const mer = m[4];

  if ([h, min, sec].some(Number.isNaN) || min > 59 || sec > 59 || h < 1 || h > 12) return null;
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;

  return { h, m: min, s: sec };
}
