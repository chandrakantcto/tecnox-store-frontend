/** Simple RFC-style email check for auth forms. */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
