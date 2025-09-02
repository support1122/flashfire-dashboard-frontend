export function getTimeAgo(dateString: string): string {
  if (!dateString || typeof dateString !== "string") return "N/A";

  try {
    // Handle ISO 8601 format: "2025-08-29T16:56:36.079Z"
    if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-'))) {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) return "Added now";
      
      const now = new Date();
      // const diffMs = now.getTime() - parsedDate.getTime();
      let diffMs = now.getTime() - parsedDate.getTime();
      
      if (diffMs < 0) diffMs = 0; // Clamp future dates to "now"
      
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffMonth / 12);

      // Cushion for minor TZ/drift issues
      const sameDay = 
        parsedDate.getFullYear() === now.getFullYear() &&
        parsedDate.getMonth() === now.getMonth() &&
        parsedDate.getDate() === now.getDate();

      if (sameDay && Math.floor(diffMin) <= 120) {
        return "Added now";
      }

      if (diffSec < 3600) return "Added now";
      if (diffHr < 24) return `Added ${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
      if (diffDay < 30) return `Added ${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
      if (diffMonth < 12) return `Added ${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
      return `Added ${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
    }

    // Handle legacy localized format: "dd/mm/yyyy, hh:mm:ss am/pm"
    const parts = dateString.trim().split(",");
    if (parts.length !== 2) return "Added now";

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
    const now = new Date();
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
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);

    // Cushion for minor TZ/drift issues
    const sameDay =
      parsedDate.getFullYear() === now.getFullYear() &&
      parsedDate.getMonth() === now.getMonth() &&
      parsedDate.getDate() === now.getDate();

    if (sameDay && Math.floor(diffMin) <= 120) {
      return "Added now";
    }

    if (diffSec < 3600) return "Added now";
    if (diffHr < 24) return `Added ${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    if (diffDay < 30) return `Added ${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
    if (diffMonth < 12) return `Added ${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
    return `Added ${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
  } catch (error) {
    console.error("Error parsing date:", error);
    return "Added now";
  }
}

// Helper function to convert 12-hour time to 24-hour
function to24HourParts(timeStr: string): { h: number; m: number; s: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;

  let [, h, m, s, ampm] = match;
  let hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  const second = parseInt(s || "0", 10);

  if (ampm.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

  return { h: hour, m: minute, s: second };
}

