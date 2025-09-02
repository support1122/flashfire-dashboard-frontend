export function getTimeAgo(dateString: string): string {
  if (!dateString || typeof dateString !== "string") return "N/A";

  try {
    const parts = dateString.trim().split(",");
    if (parts.length !== 2) return "Added now" //"N/A";

    const datePart = parts[0].trim(); // "8/12/2025"
    const timePart = parts[1].trim(); // "11:33:33 PM"

    // Parse date parts
    let [m1, d1, y1] = datePart.split("/").map(s => Number(s.trim()));
    if (!m1 || !d1 || !y1 || m1 > 12 || d1 > 31) return "Added now";
    if (y1 < 100) y1 += 2000; // Handle 2-digit years

    // Parse time
    const t = to24HourParts(timePart);
    if (!t) return "N/A";

    // Parse as local time (IST)
    let parsedDate = new Date(y1, m1 - 1, d1, t.h, t.m, t.s || 0);
    const now = new Date(); // Current time in IST
    let diffMs = now.getTime() - parsedDate.getTime();

    // If MM/DD/YYYY results in a future date, try DD/MM/YYYY
    if (diffMs < 0) {
      parsedDate = new Date(y1, d1 - 1, m1, t.h, t.m, t.s || 0);
      diffMs = now.getTime() - parsedDate.getTime();
    }

    if (diffMs < 0) diffMs = 0; // Clamp future dates to "now"

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffMonth = Math.floor(diffDay / 30); // Approximate
    const diffYear = Math.floor(diffMonth / 12);

    // Cushion for minor TZ/drift issues (treat up to ~2 hours as "now" if same day)
const sameDay =
  parsedDate.getFullYear() === now.getFullYear() &&
  parsedDate.getMonth() === now.getMonth() &&
  parsedDate.getDate() === now.getDate();

if (sameDay && Math.floor(diffMin) <= 120) {
  return "Added now";
}


    if (diffSec < 3600) return "Added now"; // Less than 1 hour
    if (diffHr < 24) return `Added ${diffHr} hour${diffHr === 1 ? "" : "s"} ago`; // 1 hour to 1 day
    if (diffDay < 30) return `Added ${diffDay === 1 ? "a" : diffDay} day${diffDay === 1 ? "" : "s"} ago`; // 1 day to 1 month
    if (diffMonth < 12) return `Added ${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`; // 1 month to 1 year
    return `Added ${diffYear} year${diffYear === 1 ? "" : "s"} ago`; // More than 1 year
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
