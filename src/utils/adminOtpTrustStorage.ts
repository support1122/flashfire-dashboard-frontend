/** Admin OTP “trust this browser” for embedded resume optimizer — localStorage TTL matches JWT from backend. */

export const ADMIN_OTP_TRUST_TTL_7D_MS = 7 * 24 * 60 * 60 * 1000;
export const ADMIN_OTP_TRUST_TTL_30D_MS = 30 * 24 * 60 * 60 * 1000;
/** @deprecated use ADMIN_OTP_TRUST_TTL_7D_MS */
export const ADMIN_OTP_TRUST_TTL_MS = ADMIN_OTP_TRUST_TTL_7D_MS;

export const FLASHFIRE_OPTIMIZER_OTP_TRUST_KEY = 'optimizerOtpTrust';

function resolveExpiry(parsed: Record<string, unknown>): number | null {
  if (typeof parsed.expiresAt === 'number') return parsed.expiresAt;
  if (typeof parsed.verifiedAt === 'number') return parsed.verifiedAt + ADMIN_OTP_TRUST_TTL_7D_MS;
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

export function saveAdminOtpTrust(
  storageKey: string,
  emailRaw: string,
  trustToken: string,
  ttlMs: number = ADMIN_OTP_TRUST_TTL_7D_MS
) {
  const email = (emailRaw || '').trim().toLowerCase();
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      email,
      trustToken,
      expiresAt: Date.now() + ttlMs,
    })
  );
}

export function clearAdminOtpTrust(storageKey: string) {
  localStorage.removeItem(storageKey);
}
