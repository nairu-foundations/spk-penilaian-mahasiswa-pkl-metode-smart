import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { ShieldAlert, ArrowLeft, LogOut, Crown, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, logout, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8">Memuat sesi akun...</div>;

  // If user is guest/not logged in
  if (!user || user.id === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if current role is authorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Akses Ditolak (403 Unauthorized)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {role === 'mahasiswa' ? (
                <>
                  Akun Anda terdaftar sebagai <strong>Mahasiswa PKL</strong> ({user.nama}). Mahasiswa tidak memiliki izin akses ke <strong>Dashboard Admin</strong> PT Seven Inc.
                </>
              ) : role === 'admin' ? (
                <>
                  Akun Anda adalah <strong>Admin HRD</strong> ({user.nama}). Modul ini khusus dibatasi untuk <strong>Super Admin (Founder &amp; Pemilik PT Seven Inc.)</strong>.
                </>
              ) : (
                <>
                  Akun Anda saat ini tidak memiliki izin yang sesuai untuk membuka halaman ini.
                </>
              )}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono text-left space-y-1 border border-slate-100 dark:border-slate-800">
            <p>
              Akun Aktif: <strong className="text-slate-900 dark:text-white">{user.nama}</strong>
            </p>
            <p>
              Peran: <span className="uppercase font-bold text-blue-600">{role}</span>
            </p>
            <p>
              Target Izin: <span className="text-slate-500">{allowedRoles.join(' / ')}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {role === 'mahasiswa' ? (
              <Link
                to="/mahasiswa"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Portal Mahasiswa PKL</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard Utama</span>
              </Link>
            )}

            <Link
              to="/login"
              onClick={() => logout()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Akun Lain</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
