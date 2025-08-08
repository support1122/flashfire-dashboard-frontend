export function getTimeAgo(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') return 'N/A';

  try {
    const [datePart, timePartRaw] = dateString.trim().split(',').map(s => s.trim());

    if (!datePart || !timePartRaw) return 'N/A';

    const [month, day, year] = datePart.split('/').map(Number);
    if (!month || !day || !year) return 'N/A';

    const time24 = convertTo24Hour(timePartRaw);
    if (!time24) return 'N/A';

    const [hours, minutes, seconds] = time24.split(':').map(Number);
    const addedDate = new Date(year, month - 1, day, hours, minutes, seconds);
    if (isNaN(addedDate.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = now.getTime() - addedDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Added Now';
    if (diffMin < 60) return 'Added less than an hour ago';
    if (diffHr === 1) return 'Added an hour ago';
    if (diffHr < 24) return `Added ${diffHr} hours ago`;
    if (diffDay === 1) return 'Added 1 day ago';
    return `Added ${diffDay} days ago`;
  } catch (err) {
    console.error('getTimeAgo error:', err);
    return 'N/A';
  }
}

function convertTo24Hour(time12h: string): string | null {
  const parts = time12h.split(' ');
  if (parts.length !== 2) return null;

  const [time, modifier] = parts;
  let [hours, minutes, seconds] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;

  if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
