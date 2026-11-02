import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/common/PublicLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public & Student Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardMahasiswa } from './pages/mahasiswa/DashboardMahasiswa';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMahasiswa } from './pages/admin/AdminMahasiswa';
import { AdminPeriode } from './pages/admin/AdminPeriode';
import { AdminKriteria } from './pages/admin/AdminKriteria';
import { AdminInputPenilaian } from './pages/admin/AdminInputPenilaian';
import { AdminPerhitunganSMART } from './pages/admin/AdminPerhitunganSMART';
import { AdminHasilPeringkat } from './pages/admin/AdminHasilPeringkat';
import { AdminPengajuanPKL } from './pages/admin/AdminPengajuanPKL';
import { AdminPengguna } from './pages/admin/AdminPengguna';
import { AdminPengaturanAkun } from './pages/admin/AdminPengaturanAkun';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Frontend for PKL Assessment & Rankings */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/hasil-peringkat" element={<LandingPage />} />
            <Route path="/kriteria" element={<LandingPage />} />

            {/* Dedicated Mahasiswa PKL Portal (Strictly for Mahasiswa & Founder) */}
            <Route
              path="/mahasiswa"
              element={
                <ProtectedRoute allowedRoles={['mahasiswa', 'super_admin']}>
                  <DashboardMahasiswa />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Authentication Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Dashboard Protected Routes (Only HRD & Founder, Mahasiswa is strictly blocked) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="mahasiswa" element={<AdminMahasiswa />} />
            <Route path="periode" element={<AdminPeriode />} />
            <Route path="kriteria" element={<AdminKriteria />} />
            <Route path="input-penilaian" element={<AdminInputPenilaian />} />
            <Route path="perhitungan-smart" element={<AdminPerhitunganSMART />} />
            <Route path="hasil-peringkat" element={<AdminHasilPeringkat />} />
            <Route path="pengajuan" element={<AdminPengajuanPKL />} />
            <Route path="pengguna" element={<AdminPengguna />} />
            <Route path="cms" element={<Navigate to="/admin" replace />} />
            <Route path="pengaturan" element={<AdminPengaturanAkun />} />

            {/* Exclusive Founder Route: HRD is blocked */}
            <Route
              path="audit-log"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminAuditLog />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Redirects */}
          <Route path="/tempat-pkl" element={<Navigate to="/" replace />} />
          <Route path="/proses-smart" element={<Navigate to="/" replace />} />
          <Route path="/riwayat-pengajuan" element={<Navigate to="/" replace />} />
          <Route path="/profil" element={<Navigate to="/mahasiswa" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
