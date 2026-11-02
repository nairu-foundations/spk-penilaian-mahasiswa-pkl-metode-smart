import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserProfile } from '../types';
import { authService, SUPER_ADMIN_PROFILE, HRD_ADMIN_PROFILE } from '../services/authService';

interface AuthContextType {
  user: UserProfile;
  role: Role;
  isSuperAdmin: boolean;
  isAdminHRD: boolean;
  isMahasiswa: boolean;
  login: (usernameOrEmail: string, pass?: string, role?: Role) => Promise<UserProfile>;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => authService.getCurrentUser());

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const login = async (usernameOrEmail: string, pass?: string, role?: Role) => {
    const logged = await authService.signIn(usernameOrEmail, pass, role);
    setUser(logged);
    return logged;
  };

  const logout = () => {
    authService.signOut();
    const guestUser: UserProfile = {
      id: 'guest',
      nama: 'Tamu / Pengunjung',
      email: '',
      jabatan: 'Pengunjung Sistem',
      role: 'mahasiswa',
    };
    authService.setCurrentUser(guestUser);
    setUser(guestUser);
  };

  const switchRole = (newRole: Role) => {
    if (newRole === 'super_admin') {
      authService.setCurrentUser(SUPER_ADMIN_PROFILE);
      setUser(SUPER_ADMIN_PROFILE);
    } else if (newRole === 'admin') {
      authService.setCurrentUser(HRD_ADMIN_PROFILE);
      setUser(HRD_ADMIN_PROFILE);
    } else {
      const defaultMhs: UserProfile = {
        id: 'mhs-1',
        nama: 'Andi Pratama',
        nim: '20241001',
        email: 'andi.pratama@mail.ugm.ac.id',
        bagian: 'IT / Software Engineering',
        institusi: 'Universitas Gadjah Mada',
        periode: 'Periode 1 - 2025',
        jabatan: 'Peserta Magang IT - PT Seven Inc.',
        role: 'mahasiswa',
      };
      authService.setCurrentUser(defaultMhs);
      setUser(defaultMhs);
    }
  };

  const refreshUser = () => {
    setUser(authService.getCurrentUser());
  };

  const role: Role = user.role || 'mahasiswa';
  const isSuperAdmin = role === 'super_admin';
  const isAdminHRD = role === 'admin';
  const isMahasiswa = role === 'mahasiswa';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isSuperAdmin,
        isAdminHRD,
        isMahasiswa,
        login,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
