'use client';

import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { Notice } from '@/components/ui';
import { call } from '@/lib/api';

interface Result { status: string }
interface GenResp { period: string; results: Result[]; nextCursor: string | null }

export default function TagihanPage() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function generate() {
    setBusy(true);
    setMsg(null);
    const total: Record<string, number> = {};
    try {
      let afterId: string | null = null;
      do {
        const res: GenResp = await call<GenResp>('generateMonthlyIpl', { period, limit: 25, ...(afterId ? { afterId } : {}) });
        for (const r of res.results) total[r.status] = (total[r.status] ?? 0) + 1;
        afterId = res.nextCursor;
      } while (afterId);
      setSummary(total);
      setMsg({ kind: 'ok', text: `Tagihan IPL periode ${period} selesai dibuat. Mengulang tidak menggandakan tagihan.` });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <h2>Buat Tagihan IPL Bulanan</h2>
      <p className="muted">Nominal Rp100.000 per rumah aktif untuk periode terpilih. Rumah tanpa kepala keluarga dilewati. Aman dijalankan ulang.</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card">
        <div className="field" style={{ maxWidth: 240 }}>
          <label htmlFor="period">Periode (YYYY-MM)</label>
          <input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} pattern="20\d{2}-(0[1-9]|1[0-2])" />
        </div>
        <button className="btn" disabled={busy || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)} onClick={generate}>
          {busy ? 'Membuat tagihan...' : 'Buat tagihan'}
        </button>
        {summary && (
          <div style={{ marginTop: 16 }}>
            <h3>Ringkasan</h3>
            <ul>
              {Object.entries(summary).map(([k, v]) => (
                <li key={k}>{k}: {v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}
