'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type Role = 'resident' | 'committee' | 'super_admin';

export interface AdminProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: Role;
  active: boolean;
}

/** Peran yang BOLEH masuk admin web. Backend tetap menegakkan izin per operasi. */
export const ADMIN_ROLES: Role[] = ['committee', 'super_admin'];

interface AuthState {
  loading: boolean;
  user: User | null;
  profile: AdminProfile | null;
  /** true kalau login sukses tapi peran tidak diizinkan (mis. warga). */
  forbidden: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'signOut'>>({
    loading: true,
    user: null,
    profile: null,
    forbidden: false,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, profile: null, forbidden: false });
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();
      const profile: AdminProfile | null = data
        ? {
            uid: user.uid,
            email: user.email,
            displayName: (data.displayName as string) ?? user.email ?? '',
            role: data.role as Role,
            active: data.active === true,
          }
        : null;
      const allowed = !!profile && profile.active && ADMIN_ROLES.includes(profile.role);
      setState({
        loading: false,
        user,
        profile: allowed ? profile : null,
        forbidden: !allowed,
      });
    });
  }, []);

  return (
    <Ctx.Provider value={{ ...state, signOut: () => fbSignOut(auth) }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return v;
}
