'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice } from '@/components/ui';
import { call, newRequestId, ApiError } from '@/lib/api';

interface House { id: string; label: string; active: boolean; primaryResidentId: string | null; occupancyType: string | null }
interface Resident { id: string; fullName: string; houseId: string; status: string }
interface ListResp<T> { items: T[] }

const OCC_LABEL: Record<string, string> = { OWNER: 'Milik sendiri', RENTER: 'Sewa / kontrak' };

export default function RumahPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState({ houseId: '', block: '', houseNumber: '' });
  const [reg, setReg] = useState({ residentUid: '', houseId: '', fullName: '', isHead: false });

  async function load() {
    try {
      const [h, r] = await Promise.all([
        call<ListResp<House>>('listAdminRecords', { resource: 'houses', limit: 50 }),
        call<ListResp<Resident>>('listAdminRecords', { resource: 'residents', limit: 50 }),
      ]);
      setHouses(h.items);
      setResidents(r.items);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    }
  }

  useEffect(() => { load(); }, []);

  function report(text: string, kind: 'ok' | 'err' = 'ok') { setMsg({ kind, text }); }

  async function run(fn: () => Promise<unknown>, okText: string) {
    setMsg(null);
    try {
      await fn();
      report(okText);
      await load();
    } catch (e) {
      report((e as ApiError).message, 'err');
    }
  }

  async function addHouse(e: FormEvent) {
    e.preventDefault();
    await run(() => call('createHouse', { ...form }), 'Rumah ditambahkan.');
    setForm({ houseId: '', block: '', houseNumber: '' });
  }

  async function addResident(e: FormEvent) {
    e.preventDefault();
    await run(() => call('registerResident', { ...reg }), 'Warga didaftarkan.');
    setReg({ residentUid: '', houseId: '', fullName: '', isHead: false });
  }

  async function setActive(r: Resident, active: boolean) {
    const reason = window.prompt(active ? 'Alasan mengaktifkan warga:' : 'Alasan menonaktifkan warga:');
    if (!reason?.trim()) return;
    await run(() => call('setResidentActive', { residentUid: r.id, active, reason: reason.trim() }), 'Status warga diperbarui.');
  }

  async function transfer(h: House) {
    const reason = window.prompt(`Alasan transfer hunian ${h.label} (semua penghuni lama akan dinonaktifkan):`);
    if (!reason?.trim()) return;
    await run(() => call('transferHouse', { houseId: h.id, reason: reason.trim(), requestId: newRequestId() }), 'Hunian dikosongkan. Daftarkan penghuni baru.');
  }

  async function setOcc(h: House, occupancyType: string) {
    const reason = window.prompt('Alasan / dasar status hunian (mis. sertifikat, kontrak):');
    if (!reason?.trim()) return;
    await run(() => call('setHouseOccupancy', { houseId: h.id, occupancyType, reason: reason.trim(), requestId: newRequestId() }), 'Status hunian diperbarui.');
  }

  return (
    <Shell>
      <h2>Rumah & Warga</h2>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="card">
        <h3>Daftar Rumah</h3>
        {houses.length === 0 ? <Empty>Belum ada rumah.</Empty> : (
          <table>
            <thead><tr><th>Rumah</th><th>Status</th><th>Hunian</th><th>Aksi</th></tr></thead>
            <tbody>
              {houses.map((h) => (
                <tr key={h.id}>
                  <td>{h.label}<div className="muted">{h.id}</div></td>
                  <td><span className={`badge ${h.active ? 'ok' : 'err'}`}>{h.active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>{h.occupancyType ? OCC_LABEL[h.occupancyType] : <span className="muted">Belum diatur</span>}</td>
                  <td className="row">
                    <button className="btn secondary small" onClick={() => setOcc(h, 'OWNER')}>Milik sendiri</button>
                    <button className="btn secondary small" onClick={() => setOcc(h, 'RENTER')}>Sewa</button>
                    <button className="btn danger small" onClick={() => transfer(h)}>Transfer hunian</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <form className="card" onSubmit={addHouse}>
          <h3>Tambah rumah</h3>
          <div className="field"><label>ID rumah (unik)</label><input required value={form.houseId} onChange={(e) => setForm({ ...form, houseId: e.target.value })} /></div>
          <div className="field"><label>Blok</label><input required value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} /></div>
          <div className="field"><label>Nomor rumah</label><input required value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} /></div>
          <button className="btn" type="submit">Simpan rumah</button>
        </form>

        <form className="card" onSubmit={addResident}>
          <h3>Daftarkan warga</h3>
          <p className="muted">UID akun Firebase Auth warga harus sudah dibuat terlebih dahulu.</p>
          <div className="field"><label>UID akun warga</label><input required value={reg.residentUid} onChange={(e) => setReg({ ...reg, residentUid: e.target.value })} /></div>
          <div className="field"><label>ID rumah</label><input required value={reg.houseId} onChange={(e) => setReg({ ...reg, houseId: e.target.value })} /></div>
          <div className="field"><label>Nama lengkap</label><input required value={reg.fullName} onChange={(e) => setReg({ ...reg, fullName: e.target.value })} /></div>
          <div className="field"><label><input style={{ width: 'auto', marginRight: 6 }} type="checkbox" checked={reg.isHead} onChange={(e) => setReg({ ...reg, isHead: e.target.checked })} />Kepala keluarga</label></div>
          <button className="btn" type="submit">Daftarkan</button>
        </form>
      </div>

      <div className="card">
        <h3>Warga</h3>
        {residents.length === 0 ? <Empty>Belum ada warga.</Empty> : (
          <table>
            <thead><tr><th>Nama</th><th>Rumah</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id}>
                  <td>{r.fullName}<div className="muted">{r.id}</div></td>
                  <td>{r.houseId}</td>
                  <td><span className={`badge ${r.status === 'ACTIVE' ? 'ok' : 'err'}`}>{r.status}</span></td>
                  <td className="row">
                    {r.status === 'ACTIVE'
                      ? <button className="btn danger small" onClick={() => setActive(r, false)}>Nonaktifkan</button>
                      : <button className="btn small" onClick={() => setActive(r, true)}>Aktifkan</button>}
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
