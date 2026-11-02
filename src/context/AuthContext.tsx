import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserProfile } from '../types';
import { authService, GUEST_PROFILE } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: UserProfile;
  role: Role;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdminHRD: boolean;
  isMahasiswa: boolean;
  login: (email: string, password?: string, role?: Role) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshUser = async () => {
    setUser(await authService.loadCurrentUser());
  };
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const profile = await authService.loadCurrentUser(); if (active) { setUser(profile); setError(''); } }
      catch (e) { if (active) { setUser(GUEST_PROFILE); setError(e instanceof Error ? e.message : 'Gagal memuat sesi akun.'); } }
      finally { if (active) setLoading(false); }
    };
    void refresh();
    // Run profile queries outside the synchronous Auth callback to avoid auth-lock deadlocks.
    const { data } = supabase?.auth.onAuthStateChange(() => { queueMicrotask(() => { if (active) void refresh(); }); }) ?? { data: null };
    return () => { active = false; data?.subscription.unsubscribe(); };
  }, []);
  const login = async (email: string, password?: string, role?: Role) => {
    const profile = await authService.signIn(email, password, role);
    setUser(profile); setError(''); return profile;
  };
  const logout = async () => { await authService.signOut(); setUser(GUEST_PROFILE); };
  const role = user.role;
  return <AuthContext.Provider value={{user, role, loading, login, logout, refreshUser,
    isSuperAdmin: role === 'super_admin', isAdminHRD: role === 'admin',
    isMahasiswa: role === 'mahasiswa' && user.id !== 'guest'}}>
    {error && <div role="alert" className="p-3 bg-red-50 text-red-800 text-sm">{error}</div>}
    {children}
  </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return context;
};
