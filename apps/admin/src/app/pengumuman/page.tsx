'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatDate } from '@/components/ui';
import { call, newRequestId, ApiError } from '@/lib/api';

type Kind = 'announcements' | 'events';
interface Item { id: string; title: string; description: string; status: string; version: number; startsAt?: unknown; endsAt?: unknown; location?: string | null }

const EMPTY = { id: '', type: 'announcements' as Kind, title: '', description: '', status: 'DRAFT', version: 0, startsAt: '', endsAt: '', location: '' };

/** Waktu dari backend bisa berupa Timestamp {_seconds} atau ISO; datetime-local butuh 'YYYY-MM-DDTHH:mm'. */
function toLocalInput(v: unknown): string {
  const ms = typeof v === 'string' ? Date.parse(v) : (v as { _seconds?: number })?._seconds ? (v as { _seconds: number })._seconds * 1000 : NaN;
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PengumumanPage() {
  const [rows, setRows] = useState<{ type: Kind; item: Item }[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function load() {
    try {
      const [a, e] = await Promise.all([
        call<{ items: Item[] }>('listAdminRecords', { resource: 'announcements', limit: 50 }),
        call<{ items: Item[] }>('listAdminRecords', { resource: 'events', limit: 50 }),
      ]);
      setRows([...a.items.map((item) => ({ type: 'announcements' as Kind, item })), ...e.items.map((item) => ({ type: 'events' as Kind, item }))]);
    } catch (err) {
      setMsg({ kind: 'err', text: (err as Error).message });
    }
  }
  useEffect(() => { load(); }, []);

  function edit(type: Kind, it: Item) {
    setForm({
      id: it.id, type, title: it.title, description: it.description, status: it.status, version: it.version,
      startsAt: toLocalInput(it.startsAt), endsAt: toLocalInput(it.endsAt), location: it.location ?? '',
    });
    setMsg(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const isNew = !form.id;
    const payload: Record<string, unknown> = {
      type: form.type,
      contentId: isNew ? newRequestId() : form.id,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      expectedVersion: isNew ? 0 : form.version,
    };
    if (form.type === 'events') {
      payload.startsAt = new Date(form.startsAt).toISOString();
      payload.endsAt = new Date(form.endsAt).toISOString();
      payload.location = form.location.trim();
    }
    try {
      await call('saveCommunityContent', payload);
      setMsg({ kind: 'ok', text: isNew ? 'Konten dibuat.' : 'Konten diperbarui.' });
      setForm(EMPTY);
      await load();
    } catch (err) {
      setMsg({ kind: 'err', text: (err as ApiError).message });
    }
  }

  return (
    <Shell>
      <h2>Pengumuman & Agenda</h2>
      <p className="muted">Warga hanya melihat konten berstatus PUBLISHED. Simpan sebagai DRAFT dulu bila masih perlu dicek.</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <form className="card" onSubmit={save}>
        <h3>{form.id ? 'Ubah konten' : 'Buat konten baru'}</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="field">
            <label>Jenis</label>
            <select value={form.type} disabled={!!form.id} onChange={(e) => setForm({ ...form, type: e.target.value as Kind })}>
              <option value="announcements">Pengumuman</option>
              <option value="events">Agenda</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Terbit</option>
              {form.id && <option value="ARCHIVED">Arsip</option>}
            </select>
          </div>
          <div className="field"><label>Judul</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: 'span 3' }}>
            <label>Isi</label>
            <textarea rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {form.type === 'events' && (
            <>
              <div className="field"><label>Mulai</label><input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div className="field"><label>Selesai</label><input required type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
              <div className="field"><label>Lokasi</label><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </>
          )}
        </div>
        <div className="row">
          <button className="btn" type="submit">{form.id ? 'Simpan perubahan' : 'Buat'}</button>
          {form.id && <button className="btn secondary" type="button" onClick={() => setForm(EMPTY)}>Batal</button>}
        </div>
      </form>

      <div className="card">
        {rows.length === 0 ? <Empty>Belum ada konten.</Empty> : (
          <table>
            <thead><tr><th>Jenis</th><th>Judul</th><th>Status</th><th>Waktu</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map(({ type, item }) => (
                <tr key={`${type}-${item.id}`}>
                  <td>{type === 'announcements' ? 'Pengumuman' : 'Agenda'}</td>
                  <td>{item.title}</td>
                  <td><span className="badge">{item.status}</span></td>
                  <td>{type === 'events' ? formatDate(item.startsAt) : '-'}</td>
                  <td><button className="btn secondary small" onClick={() => edit(type, item)}>Ubah</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
