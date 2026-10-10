'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatDate } from '@/components/ui';
import { call, newRequestId, ApiError } from '@/lib/api';

interface Sub { id: string; status: string; activeUntil: unknown; lastApprovedPaymentId: string | null; packageId: string; primaryResidentId: string }

const BADGE: Record<string, string> = { ACTIVE: 'ok', EXPIRING_SOON: 'warn', EXPIRED: 'err', PENDING_ACTIVATION: 'warn', SUSPENDED: 'err', TERMINATED: 'err' };

export default function InternetPage() {
  const [items, setItems] = useState<Sub[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await call<{ items: Sub[] }>('listAdminRecords', { resource: 'internet_subscriptions', limit: 50 });
      setItems(res.items);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    }
  }
  useEffect(() => { load(); }, []);

  async function activate(s: Sub) {
    if (!s.lastApprovedPaymentId) return;
    const reason = window.prompt(`Alasan aktivasi internet rumah ${s.id}:`);
    if (!reason?.trim()) return;
    setMsg(null);
    try {
      await call('activateInternetService', { houseId: s.id, paymentId: s.lastApprovedPaymentId, requestId: newRequestId(), reason: reason.trim() });
      setMsg({ kind: 'ok', text: 'Layanan diaktifkan. Ingat: aktivasi jaringan dilakukan manual di perangkat/ISP.' });
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as ApiError).message });
    }
  }

  async function refreshStatuses() {
    setBusy(true);
    setMsg(null);
    try {
      let afterId: string | null = null;
      let changed = 0;
      do {
        const res: { results: { changed: boolean }[]; nextCursor: string | null } = await call('updateInternetSubscriptionStatuses', { limit: 25, ...(afterId ? { afterId } : {}) });
        changed += res.results.filter((r) => r.changed).length;
        afterId = res.nextCursor;
      } while (afterId);
      setMsg({ kind: 'ok', text: `Status diperbarui. ${changed} langganan berubah.` });
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: (e as ApiError).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <h2>Layanan Internet</h2>
      <p className="muted">Aktivasi dilakukan manual setelah pembayaran disetujui. Aplikasi ini tidak terhubung ke router.</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>Langganan</h3>
          <button className="btn secondary" disabled={busy} onClick={refreshStatuses}>{busy ? 'Memperbarui...' : 'Perbarui status masa aktif'}</button>
        </div>
        {items.length === 0 ? <Empty>Belum ada langganan internet.</Empty> : (
          <table>
            <thead><tr><th>Rumah</th><th>Paket</th><th>Status</th><th>Masa aktif sampai</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.packageId}</td>
                  <td><span className={`badge ${BADGE[s.status] ?? ''}`}>{s.status}</span></td>
                  <td>{formatDate(s.activeUntil)}</td>
                  <td>
                    {s.status === 'PENDING_ACTIVATION' && s.lastApprovedPaymentId
                      ? <button className="btn small" onClick={() => activate(s)}>Aktifkan</button>
                      : <span className="muted">-</span>}
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
