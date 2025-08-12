export function getTimeAgo(dateString: string): string {
  if (!dateString || typeof dateString !== "string") return "N/A";

  try {
    const parts = dateString.trim().split(",");
    if (parts.length !== 2) return "N/A";

    const datePart = parts[0].trim(); // "12/8/2025"
    const timePart = parts[1].trim(); // "12:40:41 am"

    // Parse date (MM/DD/YYYY)
    let [month, day, year] = datePart.split("/").map(s => Number(s.trim()));
    if (!month || !day || !year || month > 12 || day > 31) return "N/A";
    if (year < 100) year += 2000; // Handle 2-digit years

    // Parse time
    const t = to24HourParts(timePart);
    if (!t) return "N/A";

    // Create date in UTC to avoid local timezone interference
    const parsedDate = new Date(Date.UTC(year, month - 1, day, t.h, t.m, t.s || 0));
    const now = new Date(); // Current time in local timezone (e.g., IST)

    // Calculate difference
    let diffMs = now.getTime() - parsedDate.getTime();
    if (diffMs < 0) diffMs = 0; // Clamp future dates to "now"

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffMonth = Math.floor(diffDay / 30); // Approximate
    const diffYear = Math.floor(diffMonth / 12);

    const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${plural(diffMin, "minute")} ago`;
    if (diffHr < 24) return `${plural(diffHr, "hour")} ago`;
    if (diffDay < 30) return `${plural(diffDay, "day")} ago`;
    if (diffMonth < 12) return `${plural(diffMonth, "month")} ago`;
    return `${plural(diffYear, "year")} ago`;
  } catch {
    return "N/A";
  }
}

/** Robust 12h → 24h parser.
 * Accepts "12:40:41 am", "6:09 PM", "06:09:05 pm", etc.
 */
function to24HourParts(input: string): { h: number; m: number; s: number } | null {
  if (!input) return null;
  const s = input.replace(/\s+/g, " ").trim().toUpperCase();

  // Match hh:mm[:ss] + AM/PM
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