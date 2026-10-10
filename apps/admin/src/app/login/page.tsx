'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Notice } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/dashboard/');
    } catch {
      setError('Email atau kata sandi salah.');
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setError('Isi email terlebih dahulu.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Sengaja tidak dibedakan (anti enumerasi akun).
    }
    setInfo('Jika email terdaftar, tautan reset sudah dikirim.');
  }

  return (
    <div className="login">
      <div className="card">
        <h2 style={{ fontSize: 20 }}>Masuk Pengurus</h2>
        {error && <Notice kind="err">{error}</Notice>}
        {info && <Notice kind="ok">{info}</Notice>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw">Kata sandi</label>
            <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p style={{ textAlign: 'center' }}>
          <button className="btn secondary small" type="button" onClick={forgot}>Lupa kata sandi?</button>
        </p>
      </div>
    </div>
  );
}
