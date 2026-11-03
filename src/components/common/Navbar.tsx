import { CloudDownload } from './CloudDownload';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  Crown,
  Shield,
  LogOut,
  FileDown,
  User,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SiteSettings, MenuNavigasi } from '../../types';

interface NavbarProps {
  settings: SiteSettings | null;
  menus?: MenuNavigasi[] | null;
}

export const Navbar: React.FC<NavbarProps> = ({ settings }) => {
  const { user, role, isSuperAdmin, isAdminHRD, isMahasiswa, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandName = settings?.nama_situs || 'SMART PKL';
  const companyHost = 'PT Seven Inc.';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGuest = !user || user.id === 'guest';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {brandName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {companyHost}
              </span>
            </div>
          </Link>

          {/* Navigation Links strictly respecting role separation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              to="/"
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
                location.pathname === '/'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Penilaian &amp; Peringkat PKL
            </Link>

            {/* If Mahasiswa is logged in: Link to their Student Portal */}
            {!isGuest && isMahasiswa && (
              <Link
                to="/mahasiswa"
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold ${
                  location.pathname === '/mahasiswa'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                Beranda
              </Link>
            )}

            {/* If Admin (HRD or Founder) is logged in: Link to Admin Dashboard */}
            {!isGuest && (isAdminHRD || isSuperAdmin) && (
              <Link
                to="/admin"
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
                  location.pathname.startsWith('/admin')
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isSuperAdmin ? 'Monitoring Founder' : 'Dashboard HRD'}
              </Link>
            )}
          </nav>

          {/* Right: Identity & Login/Logout Controls */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Direct Data Mahasiswa Download Button: STRICTLY for Admin / HRD / Founder only. NEVER for Mahasiswa PKL */}
            {!isMahasiswa && (isAdminHRD || isSuperAdmin) && (
              <CloudDownload
                format="csv"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                title="Unduh Data Mahasiswa PKL (CSV)"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Berkas PKL</span>
              </CloudDownload>
            )}

            {isGuest ? (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to={isMahasiswa ? '/mahasiswa' : '/admin'}
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSuperAdmin
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isAdminHRD
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isSuperAdmin ? (
                      <Crown className="w-4 h-4" />
                    ) : isAdminHRD ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold truncate max-w-[120px]">{user.nama}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      {isSuperAdmin ? 'FOUNDER' : isAdminHRD ? 'HRD ADMIN' : 'MAHASISWA PKL'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Penilaian &amp; Peringkat PKL
          </Link>

          {!isGuest && isMahasiswa && (
            <Link
              to="/mahasiswa"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
            >
              Beranda
            </Link>
          )}

          {!isGuest && (isAdminHRD || isSuperAdmin) && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Dashboard Admin
            </Link>
          )}

          {isGuest ? (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Masuk ke Akun Anda
            </Link>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              Keluar Akun ({user.nama})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
