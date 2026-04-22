const DEFAULT_MAX_JOB_TITLE_LENGTH = 50;

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function truncateAtWordBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const sliced = value.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");

  if (lastSpace > 0) {
    return sliced.slice(0, lastSpace).trimEnd();
  }

  return sliced.trimEnd();
}

export function sanitizeJobTitle(
  input: string,
  maxLength = DEFAULT_MAX_JOB_TITLE_LENGTH
): string {
  if (!input) return "";
  const normalized = normalizeWhitespace(input);
  return truncateAtWordBoundary(normalized, maxLength);
}

export const MAX_JOB_TITLE_LENGTH = DEFAULT_MAX_JOB_TITLE_LENGTH;
