'use client';

import type { ReactNode } from 'react';

export function Notice({ kind = 'info', children }: { kind?: 'err' | 'ok' | 'info'; children: ReactNode }) {
  return <div className={`notice ${kind}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}

export function formatRupiah(n: number): string {
  return 'Rp' + Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDate(v: unknown): string {
  // Backend mengirim Timestamp (_seconds) atau ISO string.
  const d = typeof v === 'string' ? new Date(v) : (v as { _seconds?: number })?._seconds ? new Date(((v as { _seconds: number })._seconds) * 1000) : null;
  if (!d || Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
}
