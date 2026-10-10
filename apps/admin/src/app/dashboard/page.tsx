'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Notice } from '@/components/ui';
import { call } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ListResp { items: unknown[] }

export default function DashboardPage() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<{ pembayaran: number; laporan: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ipl, internet, reports] = await Promise.all([
          call<ListResp>('listAdminRecords', { resource: 'ipl_payments', limit: 50 }),
          call<ListResp>('listAdminRecords', { resource: 'internet_payments', limit: 50 }),
          call<ListResp>('listAdminRecords', { resource: 'reports', limit: 50 }),
        ]);
        const openReports = reports.items.filter((r) => {
          const s = (r as { status: string }).status;
          return s !== 'CLOSED' && s !== 'RESOLVED';
        });
        setCounts({ pembayaran: ipl.items.length + internet.items.length, laporan: openReports.length });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <Shell>
      <h2>Halo, {profile?.displayName}</h2>
      {error && <Notice kind="err">{error}</Notice>}
      <div className="grid grid-3">
        <div className="card">
          <div className="muted">Pembayaran menunggu verifikasi</div>
          <div className="stat">{counts ? counts.pembayaran : '...'}</div>
        </div>
        <div className="card">
          <div className="muted">Laporan warga belum selesai</div>
          <div className="stat">{counts ? counts.laporan : '...'}</div>
        </div>
      </div>
      <p className="muted">Pilih menu di kiri untuk mulai bekerja.</p>
    </Shell>
  );
}
