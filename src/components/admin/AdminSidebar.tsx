import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Calendar,
  Sliders,
  FileSpreadsheet,
  Calculator,
  Trophy,
  Crown,
  History,
  LogOut,
  X,
  FileDown,
  Lock,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0c182c] text-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              SMART PKL
            </h1>
            <p className="text-xs text-blue-300/80 font-medium">PT Seven Inc.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge Indicator - No easy bypass switcher, strict account identity */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isSuperAdmin ? (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold ${
                isSuperAdmin ? 'text-amber-400' : 'text-blue-400'
              }`}
            >
              {isSuperAdmin ? 'Founder & Pemilik' : 'HRD Officer (Admin)'}
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[150px]">
              {user.nama}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
          title="Ganti Akun / Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
        {/* IF SUPER ADMIN (FOUNDER): Executive Monitoring & Audit */}
        {isSuperAdmin ? (
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
              <Crown className="w-3 h-3" />
              <span>Panel Eksekutif Founder</span>
            </p>
            <div className="space-y-1">
              <NavLink to="/admin" end className={navItemClass} onClick={onClose}>
                <LayoutDashboard className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Monitoring Eksekutif</span>
              </NavLink>
              <NavLink to="/admin/audit-log" className={navItemClass} onClick={onClose}>
                <History className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Audit Log &amp; Pengawasan HRD</span>
              </NavLink>
              <NavLink to="/admin/hasil-peringkat" className={navItemClass} onClick={onClose}>
                <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Pengesahan SK Juara 1</span>
              </NavLink>
              <NavLink to="/admin/mahasiswa" className={navItemClass} onClick={onClose}>
                <Users className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Rekapitulasi Mahasiswa PKL</span>
              </NavLink>
              <NavLink to="/admin/perhitungan-smart" className={navItemClass} onClick={onClose}>
                <Calculator className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Verifikasi Perhitungan SMART</span>
              </NavLink>
            </div>
          </div>
        ) : (
          /* IF HRD ADMIN: Operational Dashboard & Assessment Inputs */
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-blue-400 uppercase">
              Operasional Penilaian HRD
            </p>
            <div className="space-y-1">
              <NavLink to="/admin" end className={navItemClass} onClick={onClose}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard HRD</span>
              </NavLink>
              <NavLink to="/admin/mahasiswa" className={navItemClass} onClick={onClose}>
                <Users className="w-4 h-4 shrink-0" />
                <span>Data Mahasiswa PKL</span>
              </NavLink>
              <NavLink to="/admin/input-penilaian" className={navItemClass} onClick={onClose}>
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Input Penilaian C1, C2, C3</span>
              </NavLink>
              <NavLink to="/admin/perhitungan-smart" className={navItemClass} onClick={onClose}>
                <Calculator className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Perhitungan SMART</span>
              </NavLink>
              <NavLink to="/admin/hasil-peringkat" className={navItemClass} onClick={onClose}>
                <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Hasil &amp; Peringkat</span>
              </NavLink>
              <NavLink to="/admin/periode" className={navItemClass} onClick={onClose}>
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Periode PKL PT Seven Inc.</span>
              </NavLink>
              <NavLink to="/admin/kriteria" className={navItemClass} onClick={onClose}>
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Kriteria &amp; Bobot</span>
              </NavLink>
            </div>

            {/* Locked module for HRD */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-800 text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Audit Log Founder</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                  Terkunci
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Group: File Data Mahasiswa Unduhan Langsung */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Berkas Data PT Seven Inc.
          </p>
          <div className="px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
            <p className="text-[11px] text-slate-400">
              Unduh rekapitulasi nilai:
            </p>
            <div className="flex gap-2">
              <a
                href="/data/mahasiswa_pkl.csv"
                download="data_mahasiswa_pkl_seveninc.csv"
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 rounded text-center text-[11px] font-bold text-white transition-colors flex items-center justify-center gap-1"
              >
                <FileDown className="w-3.5 h-3.5" /> CSV
              </a>
              <a
                href="/data/mahasiswa_pkl.json"
                download="data_mahasiswa_pkl_seveninc.json"
                className="flex-1 py-1.5 px-2 bg-slate-700 hover:bg-slate-650 border border-slate-600 rounded text-center text-[11px] font-bold text-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <FileDown className="w-3.5 h-3.5" /> JSON
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Switch Account / Logout */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 bg-[#0c182c] min-h-screen">
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
