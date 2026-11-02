import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Shield,
  Crown,
  ArrowRight,
  User,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '../hooks/useData';
import { contentService } from '../services/contentService';
import { Role } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useQuery(() => contentService.getSiteSettings());

  const [roleIntent, setRoleIntent] = useState<Role>('super_admin');
  const [username, setUsername] = useState('founder');
  const [password, setPassword] = useState('founder123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const brandName = settings?.nama_situs || 'SMART PKL';
  const companyHost = 'PT Seven Inc.';
  const quote = settings?.quote_login || 'Disiplin hari ini, kesuksesan esok hari';

  const handleRoleSelect = (role: Role) => {
    setRoleIntent(role);
    setErrorMessage(null);
    if (role === 'super_admin') {
      setUsername('founder');
      setPassword('founder123');
    } else if (role === 'admin') {
      setUsername('hrd');
      setPassword('hrd123');
    } else {
      setUsername('andi.pratama@mail.ugm.ac.id'); // Andi Pratama
      setPassword('mhs123');
    }
  };

  const handleQuickStudentSelect = (email: string) => {
    setRoleIntent('mahasiswa');
    setUsername(email);
    setPassword('mhs123');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const logged = await login(username, password, roleIntent);
      if (logged.role === 'mahasiswa') {
        navigate('/mahasiswa');
      } else {
        navigate('/admin');
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal masuk. Periksa kembali akun Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* 2-Column Auth Container matching Screenshot 1 */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 min-h-[560px]">
        {/* Left Side: Dark Navy Brand Section matching Screenshot 1 */}
        <div className="w-full md:w-5/12 bg-[#0c182c] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {brandName}
              </h2>
              <p className="text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                Sistem Pendukung Keputusan Penilaian Kedisiplinan Mahasiswa PKL
              </p>
              <div className="inline-block mt-2 px-2.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                Tempat PKL: {companyHost}
              </div>
            </div>
          </div>

          {/* Quote matching Screenshot 1 */}
          <div className="relative z-10 pt-8 mt-8 border-t border-slate-800">
            <p className="italic text-sm text-slate-300 leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Metode SMART (Simple Multi Attribute Rating Technique)
            </p>
          </div>
        </div>

        {/* Right Side: Form Card with Role Tabs matching requirements */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-5">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Masuk ke Akun Anda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Silakan pilih jenis akun yang terdaftar di PT Seven Inc.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* 3 Distinct Role Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Akun yang Digunakan:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  {/* Founder */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('super_admin')}
                    className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      roleIntent === 'super_admin'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span className="text-[11px]">Founder</span>
                    <span className="text-[9px] opacity-80 font-normal">Super Admin</span>
                  </button>

                  {/* HRD */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      roleIntent === 'admin'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-[11px]">HRD Officer</span>
                    <span className="text-[9px] opacity-80 font-normal">Admin PKL</span>
                  </button>

                  {/* Mahasiswa */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('mahasiswa')}
                    className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      roleIntent === 'mahasiswa'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-[11px]">Mahasiswa</span>
                    <span className="text-[9px] opacity-80 font-normal">Peserta PKL</span>
                  </button>
                </div>
              </div>

              {/* Quick Student Selection when Mahasiswa is active */}
              {roleIntent === 'mahasiswa' && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Pilih Cepat Peserta PKL:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { email: 'andi.pratama@mail.ugm.ac.id', nama: 'Andi' },
                      { email: 'rina.anggraini@student.uny.ac.id', nama: 'Rina' },
                      { email: 'siti.nurhaliza@upnyk.ac.id', nama: 'Siti' },
                      { email: 'budi.santoso@students.uii.ac.id', nama: 'Budi' },
                      { email: 'dika.pratama@ity.ac.id', nama: 'Dika' },
                    ].map((s) => (
                      <button
                        key={s.email}
                        type="button"
                        onClick={() => handleQuickStudentSelect(s.email)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          username === s.email
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-emerald-200 dark:border-emerald-700'
                        }`}
                      >
                        {s.nama} ({s.email})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {roleIntent === 'mahasiswa' ? 'Email Mahasiswa' : 'Username / Email Akun'}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    roleIntent === 'mahasiswa'
                      ? 'e.g. andi.pratama@mail.ugm.ac.id'
                      : roleIntent === 'super_admin'
                      ? 'founder'
                      : 'hrd'
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 mt-2 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
                  roleIntent === 'super_admin'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : roleIntent === 'mahasiswa'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Memproses Masuk...' : `Login sebagai ${roleIntent === 'super_admin' ? 'Founder' : roleIntent === 'admin' ? 'HRD' : 'Mahasiswa'}`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Tempat PKL: <strong>PT Seven Inc.</strong></span>
                <div className="flex gap-2 font-mono">
                  <a
                    href="/data/mahasiswa_pkl.csv"
                    download="data_mahasiswa_pkl.csv"
                    className="text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> CSV
                  </a>
                  <span>·</span>
                  <a
                    href="/data/mahasiswa_pkl.json"
                    download="data_mahasiswa_pkl.json"
                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <FileCode className="w-3 h-3" /> JSON
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
