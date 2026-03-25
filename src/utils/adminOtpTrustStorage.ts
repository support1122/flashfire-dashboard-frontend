/** Admin OTP “trust this browser” for embedded resume optimizer — localStorage only, 7-day TTL. */

export const ADMIN_OTP_TRUST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const FLASHFIRE_OPTIMIZER_OTP_TRUST_KEY = 'optimizerOtpTrust';

function resolveExpiry(parsed: Record<string, unknown>): number | null {
  if (typeof parsed.expiresAt === 'number') return parsed.expiresAt;
  if (typeof parsed.verifiedAt === 'number') return parsed.verifiedAt + ADMIN_OTP_TRUST_TTL_MS;
  return null;
}

export function getValidAdminOtpTrustToken(storageKey: string, emailRaw: string): string | null {
  const email = (emailRaw || '').trim().toLowerCase();
  if (!email) return null;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const token = typeof parsed.trustToken === 'string' ? parsed.trustToken : null;
    if (!token || typeof parsed.email !== 'string' || parsed.email !== email) {
      return null;
    }
    const exp = resolveExpiry(parsed);
    if (exp == null || Date.now() > exp) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return token;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveAdminOtpTrust(storageKey: string, emailRaw: string, trustToken: string) {
  const email = (emailRaw || '').trim().toLowerCase();
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      email,
      trustToken,
      expiresAt: Date.now() + ADMIN_OTP_TRUST_TTL_MS,
    })
  );
}

export function clearAdminOtpTrust(storageKey: string) {
  localStorage.removeItem(storageKey);
}
