import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { AdminFeedback } from './AdminFeedback';
import './AdminAnimations.css';

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Generate dynamic breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/admin') return ['Dashboard', 'Ringkasan'];
    if (path.includes('/mahasiswa')) return ['Dashboard', 'Data Mahasiswa PKL'];
    if (path.includes('/periode')) return ['Dashboard', 'Periode PKL'];
    if (path.includes('/kriteria')) return ['Dashboard', 'Kriteria & Bobot SMART'];
    if (path.includes('/input-penilaian')) return ['Dashboard', 'Input Penilaian Matriks'];
    if (path.includes('/perhitungan-smart')) return ['Dashboard', 'Perhitungan SMART'];
    if (path.includes('/hasil-peringkat')) return ['Dashboard', 'Hasil & Peringkat'];
    if (path.includes('/pengajuan')) return ['Dashboard', 'Laporan Penilaian & Pengajuan'];
    if (path.includes('/pengguna')) return ['Pengaturan', 'Manajemen Pengguna'];
    if (path.includes('/pengaturan')) return ['Pengaturan', 'Pengaturan Akun'];
    return ['Dashboard'];
  };

  return (
    <div className="admin-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar with dark navy styling */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          breadcrumbs={getBreadcrumbs()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div key={location.pathname} className="admin-page-enter"><Outlet /></div>
        </main>
      </div>
      <AdminFeedback />
    </div>
  );
};
