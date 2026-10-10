'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatDate } from '@/components/ui';
import { call } from '@/lib/api';

interface Log { id: string; actorId: string; actorRole: string | null; action: string; resourceId: string; createdAt: unknown }

export default function AuditPage() {
  const [items, setItems] = useState<Log[]>([]);
  const [action, setAction] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load(reset: boolean, after: string | null) {
    try {
      const res = await call<{ items: Log[]; nextCursor: string | null }>('listAuditLogs', {
        limit: 30,
        ...(action.trim() ? { action: action.trim() } : {}),
        ...(resourceId.trim() ? { resourceId: resourceId.trim() } : {}),
        ...(after ? { afterCreatedAt: after } : {}),
      });
      setItems(reset ? res.items : [...items, ...res.items]);
      setCursor(res.nextCursor);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  useEffect(() => { load(true, null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Shell>
      <h2>Audit Log</h2>
      <p className="muted">Jejak setiap perubahan penting. Hanya dapat dibaca, tidak dapat diubah.</p>
      {msg && <Notice kind="err">{msg}</Notice>}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input placeholder="Filter aksi (mis. VERIFY_PAYMENT)" value={action} onChange={(e) => setAction(e.target.value)} style={{ maxWidth: 260 }} />
          <input placeholder="Filter ID sumber (resourceId)" value={resourceId} onChange={(e) => setResourceId(e.target.value)} style={{ maxWidth: 260 }} />
          <button className="btn" onClick={() => load(true, null)}>Terapkan</button>
        </div>
        {items.length === 0 ? <Empty>Belum ada catatan.</Empty> : (
          <table>
            <thead><tr><th>Waktu</th><th>Aksi</th><th>Oleh</th><th>Sumber</th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.createdAt)}</td>
                  <td><span className="badge">{l.action}</span></td>
                  <td>{l.actorRole ?? '-'}<div className="muted">{l.actorId}</div></td>
                  <td className="muted">{l.resourceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cursor && <button className="btn secondary" style={{ marginTop: 12 }} onClick={() => load(false, cursor)}>Muat lagi</button>}
      </div>
    </Shell>
  );
}
