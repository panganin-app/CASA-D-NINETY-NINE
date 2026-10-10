export const IPL_AMOUNT = 100000;
export const INTERNET_PACKAGES = Object.freeze({
  INTERNET_25: {speedMbps: 25, amount: 125000},
  INTERNET_50: {speedMbps: 50, amount: 180000},
  INTERNET_100: {speedMbps: 100, amount: 250000},
});
// Exclusive expiry instant; calendar month in Asia/Jakarta (UTC+07, no DST).
export function extendMonth(activeUntil: Date | null, verifiedAt: Date): Date {
  const start = Math.max(activeUntil?.getTime() ?? 0, verifiedAt.getTime());
  if (!Number.isFinite(start)) throw new Error('Invalid date');
  const offset = 7 * 3600000;
  const local = new Date(start + offset);
  const day = local.getUTCDate();
  local.setUTCDate(1);
  local.setUTCMonth(local.getUTCMonth() + 1);
  const last = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0)).getUTCDate();
  local.setUTCDate(Math.min(day, last));
  return new Date(local.getTime() - offset);
}
