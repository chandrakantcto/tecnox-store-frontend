export type OtpPurpose = "password-reset";

export interface OtpEntry {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  expiresAt: number;
}

const OTP_TTL_MS = 15 * 60 * 1000;

const globalForOtp = globalThis as typeof globalThis & {
  __tecnoxOtpStore?: Map<string, OtpEntry>;
};

function getStore(): Map<string, OtpEntry> {
  if (!globalForOtp.__tecnoxOtpStore) {
    globalForOtp.__tecnoxOtpStore = new Map();
  }
  return globalForOtp.__tecnoxOtpStore;
}

function storeKey(email: string, purpose: OtpPurpose) {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export function createOtp(email: string, purpose: OtpPurpose): string {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  getStore().set(storeKey(email, purpose), {
    email: email.trim().toLowerCase(),
    otp,
    purpose,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
  return otp;
}

export function checkOtp(email: string, purpose: OtpPurpose, otp: string): boolean {
  const entry = getStore().get(storeKey(email, purpose));
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    getStore().delete(storeKey(email, purpose));
    return false;
  }
  return entry.otp === otp.trim();
}

export function verifyOtp(email: string, purpose: OtpPurpose, otp: string): boolean {
  if (!checkOtp(email, purpose, otp)) return false;
  getStore().delete(storeKey(email, purpose));
  return true;
}

export const OTP_VALIDITY_SECONDS = OTP_TTL_MS / 1000;
