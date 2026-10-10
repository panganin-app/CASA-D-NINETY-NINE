'use client';

import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Empty, Notice, formatDate, formatRupiah } from '@/components/ui';
import { call, ApiError } from '@/lib/api';

interface Payment { id: string; billId: string; houseId: string; residentId: string; amount: number; proofId: string; status: string; createdAt: unknown }
interface ListResp { items: Payment[] }

type Kind = 'ipl' | 'internet';

export default function PembayaranPage() {
  const [rows, setRows] = useState<{ kind: Kind; p: Payment }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [proof, setProof] = useState<{ id: string; url: string } | null>(null);
  const [rejecting, setRejecting] = useState<{ kind: Kind; id: string } | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [ipl, internet] = await Promise.all([
        call<ListResp>('listAdminRecords', { resource: 'ipl_payments', limit: 50 }),
        call<ListResp>('listAdminRecords', { resource: 'internet_payments', limit: 50 }),
      ]);
      setRows([
        ...ipl.items.map((p) => ({ kind: 'ipl' as const, p })),
        ...internet.items.map((p) => ({ kind: 'internet' as const, p })),
      ]);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function viewProof(p: Payment) {
    try {
      const res = await call<{ contentType: string; imageBase64: string }>('getPaymentProof', { proofId: p.proofId });
      setProof({ id: p.id, url: `data:${res.contentType};base64,${res.imageBase64}` });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    }
  }

  async function decide(kind: Kind, paymentId: string, decision: 'APPROVED' | 'REJECTED', why?: string) {
    setMsg(null);
    try {
      await call('verifyPayment', { kind, paymentId, decision, ...(why ? { reason: why } : {}) });
      setMsg({ kind: 'ok', text: decision === 'APPROVED' ? 'Pembayaran disetujui.' : 'Pembayaran ditolak.' });
      setProof(null);
      setRejecting(null);
      setReason('');
      await load();
    } catch (e) {
      const err = e as ApiError;
      setMsg({ kind: 'err', text: err.message });
    }
  }

  return (
    <Shell>
      <h2>Verifikasi Pembayaran</h2>
      <p className="muted">Setujui atau tolak bukti transfer BCA. Status final hanya ditentukan di sini (sisi server).</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card">
        {loading ? <Empty>Memuat...</Empty> : rows.length === 0 ? <Empty>Tidak ada pembayaran yang menunggu verifikasi.</Empty> : (
          <table>
            <thead><tr><th>Jenis</th><th>Rumah</th><th>Nominal</th><th>Dikirim</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map(({ kind, p }) => (
                <tr key={`${kind}-${p.id}`}>
                  <td>{kind === 'ipl' ? 'IPL' : 'Internet'}</td>
                  <td>{p.houseId}</td>
                  <td>{formatRupiah(p.amount)}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td className="row">
                    <button className="btn secondary small" onClick={() => viewProof(p)}>Lihat bukti</button>
                    <button className="btn small" onClick={() => decide(kind, p.id, 'APPROVED')}>Setujui</button>
                    <button className="btn danger small" onClick={() => setRejecting({ kind, id: p.id })}>Tolak</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {proof && (
        <div className="card">
          <h3>Bukti transfer</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof.url} alt="Bukti transfer" style={{ maxWidth: '100%', maxHeight: 480 }} />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn secondary small" onClick={() => setProof(null)}>Tutup</button>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="card">
          <h3>Alasan penolakan</h3>
          <div className="field">
            <label htmlFor="why">Wajib diisi, akan terlihat oleh warga</label>
            <textarea id="why" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn danger" disabled={!reason.trim()} onClick={() => decide(rejecting.kind, rejecting.id, 'REJECTED', reason.trim())}>
              Kirim penolakan
            </button>
            <button className="btn secondary" onClick={() => setRejecting(null)}>Batal</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
