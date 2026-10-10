'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { loading, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard/' : '/login/');
  }, [loading, user, router]);
  return <div className="login muted">Memuat...</div>;
}
