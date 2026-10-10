'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Shell } from '@/components/Shell';
import { Notice } from '@/components/ui';
import { call, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Settings { iplDueDateDays: number; internetDueDateDays: number; internetExpiringSoonDays: number; version: number }

export default function PengaturanPage() {
  const { profile } = useAuth();
  const isSuper = profile?.role === 'super_admin';
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    call<Settings>('getSystemSettings').then(setS).catch((e: Error) => setMsg({ kind: 'err', text: e.message }));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    setMsg(null);
    try {
      const next = await call<Settings>('updateSystemSettings', {
        iplDueDateDays: s.iplDueDateDays,
        internetDueDateDays: s.internetDueDateDays,
        internetExpiringSoonDays: s.internetExpiringSoonDays,
        expectedVersion: s.version,
      });
      setS(next);
      setMsg({ kind: 'ok', text: 'Pengaturan disimpan.' });
    } catch (err) {
      setMsg({ kind: 'err', text: (err as ApiError).message });
    }
  }

  return (
    <Shell>
      <h2>Pengaturan Sistem</h2>
      {!isSuper && <Notice kind="info">Hanya Super Admin yang dapat mengubah pengaturan ini. Anda hanya dapat melihat.</Notice>}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {s && (
        <form className="card" onSubmit={save}>
          <div className="field"><label>Jatuh tempo IPL (tanggal ke-N tiap bulan)</label>
            <input type="number" min={1} max={60} disabled={!isSuper} value={s.iplDueDateDays} onChange={(e) => setS({ ...s, iplDueDateDays: Number(e.target.value) })} /></div>
          <div className="field"><label>Jatuh tempo tagihan internet (hari setelah dibuat)</label>
            <input type="number" min={1} max={60} disabled={!isSuper} value={s.internetDueDateDays} onChange={(e) => setS({ ...s, internetDueDateDays: Number(e.target.value) })} /></div>
          <div className="field"><label>Peringatan masa aktif internet akan habis (hari sebelumnya)</label>
            <input type="number" min={1} max={60} disabled={!isSuper} value={s.internetExpiringSoonDays} onChange={(e) => setS({ ...s, internetExpiringSoonDays: Number(e.target.value) })} /></div>
          {isSuper && <button className="btn" type="submit">Simpan</button>}
        </form>
      )}
    </Shell>
  );
}
