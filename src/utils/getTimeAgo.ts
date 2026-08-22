export function getTimeAgo(dateString: string): string {
  const d = parseAddedDate(dateString);
  if (!d) return "N/A";
  return formatFromDate(d);
}

/**
 * Parse a stored "added at" date string into a Date.
 * Handles ISO, en-IN (D/M/YYYY, lowercase meridiem), en-US (M/D/YYYY, uppercase
 * meridiem) and native-parseable formats.
 * Returns null if unparseable. Single source of truth for getTimeAgo + sort ordering.
 */
export function parseAddedDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== "string") return null;

  try {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
      const iso = new Date(dateString);
      if (!Number.isNaN(iso.getTime())) return iso;
    }

    const istDate = parseIstLocaleString(dateString);
    if (istDate) return istDate;

    const native = new Date(dateString);
    if (!Number.isNaN(native.getTime())) return native;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns epoch ms for sorting. 0 when unparseable so callers can push to bottom.
 */
export function parseAddedTimestamp(dateString: string | null | undefined): number {
  const d = parseAddedDate(dateString);
  return d ? d.getTime() : 0;
}


function to24HourParts(input: string): { h: number; m: number; s: number } | null {
  if (!input) return null;
  const s = input.replace(/\s+/g, " ").trim().toUpperCase();

  // Pattern 1: 12h clock with AM/PM
  const m12 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\b/);
  if (m12) {
    let h = Number(m12[1]);
    const min = Number(m12[2]);
    const sec = m12[3] ? Number(m12[3]) : 0;
    const mer = m12[4];

    if ([h, min, sec].some(Number.isNaN) || min > 59 || sec > 59 || h < 1 || h > 12) return null;
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return { h, m: min, s: sec };
  }

  // Pattern 2: 24h clock without AM/PM (e.g., "21:05:02")
  const m24 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const h = Number(m24[1]);
    const min = Number(m24[2]);
    const sec = m24[3] ? Number(m24[3]) : 0;
    if ([h, min, sec].some(Number.isNaN) || h < 0 || h > 23 || min > 59 || sec > 59) return null;
    return { h, m: min, s: sec };
  }

  return null;
}

// Parse a stored IST locale string (either D/M/YYYY or M/D/YYYY, see below)
// and convert it to the actual instant in UTC.
function parseIstLocaleString(input: string): Date | null {
  const parts = String(input).trim().split(",");
  if (parts.length !== 2) return null;

  const datePart = parts[0].trim();
  const timePart = parts[1].trim();

  // The collection holds THREE formats, because the writer locale changed
  // around Oct 2025: en-IN "1/5/2026, 3:59:09 pm" is D/M with a LOWERCASE
  // meridiem, en-US "5/1/2026, 3:59:09 PM" is M/D with an UPPERCASE one.
  // This function used to hardcode D/M, so every en-US row was read as the
  // wrong date - and when the month landed above 12 ("7/27/2026") Date.UTC
  // rolled it into the following year, which is how a card added last July
  // could claim it was added in a future month.
  //
  // Disambiguate the same way Utils/jobActivityTime.js does on the backend:
  // an out-of-range number settles it outright, otherwise the meridiem case.
  const nums = datePart.split("/").map((p) => Number(p.trim()));
  if (nums.length !== 3 || nums.some((n) => !Number.isFinite(n))) return null;
  const rawMeridiem = (timePart.match(/\b(am|pm|AM|PM)\b/) || [])[1] || "";
  let dd: number;
  let mm: number;
  let yyyy = nums[2];
  if (nums[0] > 12) {
    dd = nums[0];
    mm = nums[1];
  } else if (nums[1] > 12) {
    mm = nums[0];
    dd = nums[1];
  } else if (rawMeridiem && rawMeridiem === rawMeridiem.toLowerCase()) {
    dd = nums[0];
    mm = nums[1];
  } else {
    mm = nums[0];
    dd = nums[1];
  }
  if (!dd || !mm || !yyyy) return null;
  if (yyyy < 100) yyyy += 2000;
  // Reject a rolled-over month outright rather than letting Date.UTC absorb it.
  if (dd > 31 || mm > 12) return null;

  const t = to24HourParts(timePart);
  if (!t) return null;

  // Build the moment in IST, then convert to UTC epoch ms
  // IST offset is +05:30 => 330 minutes
  const istOffsetMinutes = 330;
  const utcMs = Date.UTC(yyyy, mm - 1, dd, t.h, t.m, t.s || 0) - istOffsetMinutes * 60 * 1000;
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatFromDate(parsedDate: Date): string {
  const now = new Date();
  let diffMs = now.getTime() - parsedDate.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 3600) return "Added now";
  if (diffHr < 24) return `Added ${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay < 30) return `Added ${diffDay === 1 ? "a" : diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffMonth < 12) return `Added ${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  return `Added ${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
}
