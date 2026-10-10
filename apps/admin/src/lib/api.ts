import { httpsCallable, FunctionsError } from 'firebase/functions';
import { functions } from './firebase';

/** Error domain UI -- kode dari HttpsError backend (invalid-argument, permission-denied, ...). */
export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/** Panggil Cloud Function. Semua aturan bisnis & otorisasi tetap di backend. */
export async function call<T = unknown>(name: string, data?: Record<string, unknown>): Promise<T> {
  try {
    const res = await httpsCallable<Record<string, unknown> | undefined, T>(functions, name)(data);
    return res.data;
  } catch (e) {
    const err = e as FunctionsError;
    const code = err.code?.replace('functions/', '') ?? 'unknown';
    throw new ApiError(code, err.message || 'Terjadi kesalahan.');
  }
}

/** UUID acak untuk requestId idempoten (satu per aksi pengguna). */
export function newRequestId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}
