/** Simple RFC-style email check for auth forms. */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBlankInput(value: string): boolean {
  return value.trim().length === 0;
}

/** Optional phone: empty is valid; otherwise digits only. */
export function isValidPhoneDigits(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return true;
  return /^\d+$/.test(trimmed);
}

export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "");
}
