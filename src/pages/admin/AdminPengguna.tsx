import React from 'react';
import { UserCheck, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPER_ADMIN_PROFILE, HRD_ADMIN_PROFILE } from '../../services/authService';

export const AdminPengguna: React.FC = () => {
  const { switchRole } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Aktor &amp; Pengguna Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dashboard &gt; Manajemen Pengguna · Hanya terdapat 2 aktor berwenang
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>2 Aktor Resmi PT Seven Inc.</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Nama &amp; Gelar</th>
                <th className="py-3 px-4">Email Akun</th>
                <th className="py-3 px-4">Aktor / Role</th>
                <th className="py-3 px-4">Kewenangan &amp; Kuasa</th>
                <th className="py-3 px-4 text-center">Beralih Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* Super Admin Row */}
              <tr className="bg-amber-50/30 dark:bg-amber-950/20">
                <td className="py-4 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{SUPER_ADMIN_PROFILE.nama}</span>
                </td>
                <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono">
                  {SUPER_ADMIN_PROFILE.email}
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase flex items-center gap-1 w-max">
                    <Crown className="w-3 h-3" /> SUPER ADMIN
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                  <strong>Founder / Pemilik Perusahaan</strong> (Kuasa Penuh, Pemantauan Seluruh Sistem &amp; Pengesahan Sertifikat)
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => switchRole('super_admin')}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Aktifkan Founder
                  </button>
                </td>
              </tr>

              {/* Admin HRD Row */}
              <tr className="bg-blue-50/20 dark:bg-blue-950/10">
                <td className="py-4 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>{HRD_ADMIN_PROFILE.nama}</span>
                </td>
                <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono">
                  {HRD_ADMIN_PROFILE.email}
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase flex items-center gap-1 w-max">
                    <Shield className="w-3 h-3" /> ADMIN
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                  <strong>HRD Officer</strong> (Mengelola operasional dashboard harian, data mahasiswa, input penilaian &amp; SMART)
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => switchRole('admin')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Aktifkan HRD
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
