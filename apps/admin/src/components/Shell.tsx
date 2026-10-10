'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

const NAV: { href: string; label: string; superOnly?: boolean }[] = [
  { href: '/dashboard/', label: 'Beranda' },
  { href: '/pembayaran/', label: 'Verifikasi Pembayaran' },
  { href: '/tagihan/', label: 'Tagihan IPL' },
  { href: '/internet/', label: 'Layanan Internet' },
  { href: '/rumah/', label: 'Rumah & Warga' },
  { href: '/pengumuman/', label: 'Pengumuman & Agenda' },
  { href: '/laporan/', label: 'Laporan Warga' },
  { href: '/keuangan/', label: 'Keuangan' },
  { href: '/audit/', label: 'Audit Log' },
  { href: '/pengaturan/', label: 'Pengaturan Sistem', superOnly: true },
];

/** Shell halaman pengurus: menjaga akses (login + peran) dan menampilkan navigasi. */
export function Shell({ children }: { children: ReactNode }) {
  const { loading, user, profile, forbidden, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login/');
  }, [loading, user, router]);

  if (loading) return <div className="login muted">Memuat...</div>;
  if (!user) return null;

  if (forbidden || !profile) {
    return (
      <div className="login">
        <div className="card">
          <h3>Akses ditolak</h3>
          <p className="muted">Akun ini tidak memiliki akses pengurus. Hubungi Super Admin jika ini keliru.</p>
          <button className="btn secondary" onClick={() => signOut()}>Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Casa D&apos;Ninety Nine</h1>
        <nav>
          {NAV.filter((n) => !n.superOnly || profile.role === 'super_admin').map((n) => (
            <Link key={n.href} href={n.href} className={pathname?.startsWith(n.href.replace(/\/$/, '')) ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="muted" style={{ color: '#cbd5e1', marginTop: 24, fontSize: 12 }}>
          {profile.displayName} &middot; {profile.role === 'super_admin' ? 'Super Admin' : 'Pengurus'}
        </div>
        <button className="btn secondary small" style={{ marginTop: 8 }} onClick={() => signOut()}>Keluar</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
