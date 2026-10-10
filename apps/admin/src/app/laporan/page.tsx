'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatDate } from '@/components/ui';
import { call, newRequestId, ApiError } from '@/lib/api';

interface Report { id: string; title: string; description: string; category: string; status: string; version: number; houseId: string; createdAt: unknown }

// Transisi status harus sama dengan backend (community.ts `transitions`).
const NEXT: Record<string, { to: string; label: string; danger?: boolean }[]> = {
  SUBMITTED: [{ to: 'IN_REVIEW', label: 'Tinjau' }, { to: 'REJECTED', label: 'Tolak', danger: true }],
  IN_REVIEW: [{ to: 'IN_PROGRESS', label: 'Mulai proses' }, { to: 'REJECTED', label: 'Tolak', danger: true }],
  IN_PROGRESS: [{ to: 'RESOLVED', label: 'Selesai' }],
  RESOLVED: [{ to: 'CLOSED', label: 'Tutup' }],
  REJECTED: [{ to: 'CLOSED', label: 'Tutup' }],
};

export default function LaporanPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function load() {
    try {
      const res = await call<{ items: Report[] }>('listAdminRecords', { resource: 'reports', limit: 50 });
      setItems(res.items);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    }
  }
  useEffect(() => { load(); }, []);

  async function move(r: Report, to: string, danger?: boolean) {
    const reason = window.prompt(
      danger ? 'Alasan penolakan (akan terlihat warga):' : 'Catatan untuk warga (wajib diisi):',
    );
    if (!reason?.trim()) return;
    setMsg(null);
    try {
      await call('updateReportStatus', {
        reportId: r.id,
        status: to,
        expectedVersion: r.version,
        reason: reason.trim(),
        requestId: newRequestId(),
      });
      setMsg({ kind: 'ok', text: 'Status laporan diperbarui.' });
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as ApiError).message });
    }
  }

  return (
    <Shell>
      <h2>Laporan Warga</h2>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card">
        {items.length === 0 ? <Empty>Belum ada laporan.</Empty> : (
          <table>
            <thead><tr><th>Laporan</th><th>Rumah</th><th>Status</th><th>Dikirim</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong><div className="muted">{r.category} &middot; {r.description}</div></td>
                  <td>{r.houseId}</td>
                  <td><span className="badge">{r.status}</span></td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td className="row">
                    {(NEXT[r.status] ?? []).map((a) => (
                      <button key={a.to} className={`btn small ${a.danger ? 'danger' : ''}`} onClick={() => move(r, a.to, a.danger)}>{a.label}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
