'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatRupiah } from '@/components/ui';
import { call, newRequestId, ApiError } from '@/lib/api';

interface Tx { id: string; type: string; category: string; amount: number; description: string; periodId: string; version: number }

// Kategori HARUS sama dengan backend (finance.ts).
const CATS: Record<string, string[]> = {
  INCOME: ['IPL', 'INTERNET', 'DONASI', 'LAIN_LAIN'],
  EXPENSE: ['KEAMANAN', 'KEBERSIHAN', 'PERBAIKAN', 'LISTRIK_AIR_UMUM', 'ADMINISTRASI', 'LAIN_LAIN'],
};

export default function KeuanganPage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState({ type: 'EXPENSE', category: 'KEAMANAN', amount: '', description: '', periodId: '' });

  async function load() {
    try {
      const res = await call<{ items: Tx[] }>('listAdminRecords', { resource: 'finance_transactions', limit: 50 });
      setItems(res.items);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    }
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await call('saveFinanceTransaction', {
        requestId: newRequestId(),
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        description: form.description.trim(),
        periodId: form.periodId,
      });
      setMsg({ kind: 'ok', text: 'Transaksi dicatat.' });
      setForm({ ...form, amount: '', description: '' });
      await load();
    } catch (err) {
      setMsg({ kind: 'err', text: (err as ApiError).message });
    }
  }

  async function publish() {
    const periodId = window.prompt('Periode yang akan dipublikasikan (YYYY-MM):');
    if (!periodId) return;
    setMsg(null);
    try {
      const r = await call<{ totalIncome: number; totalExpense: number; transactionCount: number }>('publishFinancePeriod', {
        requestId: newRequestId(),
        periodId,
      });
      setMsg({ kind: 'ok', text: `Periode ${periodId} dipublikasikan: ${r.transactionCount} transaksi.` });
    } catch (err) {
      setMsg({ kind: 'err', text: (err as ApiError).message });
    }
  }

  return (
    <Shell>
      <h2>Keuangan</h2>
      <p className="muted">Catatan internal. Warga hanya melihat periode yang sudah dipublikasikan.</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <form className="card" onSubmit={add}>
        <h3>Catat transaksi</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="field">
            <label>Tipe</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: CATS[e.target.value][0] })}>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>
          <div className="field">
            <label>Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATS[form.type].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>Periode (YYYY-MM)</label><input required value={form.periodId} onChange={(e) => setForm({ ...form, periodId: e.target.value })} /></div>
          <div className="field"><label>Nominal (Rp)</label><input required type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: 'span 2' }}><label>Keterangan</label><input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <button className="btn" type="submit">Catat</button>
      </form>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Transaksi</h3>
          <button className="btn" onClick={publish}>Publikasikan periode</button>
        </div>
        {items.length === 0 ? <Empty>Belum ada transaksi.</Empty> : (
          <table>
            <thead><tr><th>Periode</th><th>Tipe</th><th>Kategori</th><th>Keterangan</th><th>Nominal</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>{t.periodId}</td>
                  <td>{t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</td>
                  <td>{t.category}</td>
                  <td>{t.description}</td>
                  <td>{formatRupiah(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
