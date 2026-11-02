import React from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Crown,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  FileCheck,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { spkService } from '../../services/spkService';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminDashboard: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { data: mahasiswaList, loading: loadingMhs } = useQuery(() =>
    authService.getMahasiswaPKLList()
  );
  const { data: periodeList, loading: loadingPer } = useQuery(() =>
    spkService.getPeriode()
  );
  const { data: kriteriaList } = useQuery(() => spkService.getKriteria());

  const isLoading = loadingMhs || loadingPer;

  const totalMahasiswa = mahasiswaList?.length || 25;
  const periodeAktif = periodeList?.filter((p) => p.status === 'Aktif').length || 1;
  const sudahDinilai = 18;
  const belumDinilai = 7;

  // Line Chart Data: Nilai Rata-rata per Kriteria over weeks
  const lineData = [
    { name: 'Minggu 1', Kehadiran: 78, KetepatanWaktu: 70, Tugas: 68 },
    { name: 'Minggu 2', Kehadiran: 84, KetepatanWaktu: 76, Tugas: 75 },
    { name: 'Minggu 3', Kehadiran: 90, KetepatanWaktu: 85, Tugas: 82 },
    { name: 'Minggu 4', Kehadiran: 94, KetepatanWaktu: 89, Tugas: 88 },
  ];

  // Pie Chart Data: Distribusi Peringkat
  const pieData = [
    { name: 'Peringkat 1', value: 5, color: '#2563eb' },
    { name: 'Peringkat 2', value: 7, color: '#38bdf8' },
    { name: 'Peringkat 3', value: 6, color: '#f59e0b' },
    { name: 'Peringkat 4', value: 4, color: '#10b981' },
    { name: 'Peringkat 5+', value: 3, color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Greeting with Role-Specific Styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isSuperAdmin
                ? 'Monitoring Eksekutif Founder & Pemilik'
                : 'Dashboard Operasional HRD'}
            </h1>
            {isSuperAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Kuasa Penuh
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
                Pengelola PKL
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selamat datang kembali, <strong className="text-slate-700 dark:text-slate-200">{user.nama}</strong> · PT Seven Inc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Periode 1 - 2025 Aktif</span>
          </span>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Mahasiswa */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Mahasiswa PKL
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalMahasiswa}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>5 Aktif dihitung SMART</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Periode PKL */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Periode Aktif
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {periodeAktif}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">1 Jan - 30 Jun 2025</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Sudah Dinilai */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sudah Dinilai
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {sudahDinilai}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">72% Mahasiswa Terisi</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Belum Dinilai */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Belum Dinilai
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {belumDinilai}
            </p>
            <p className="text-[11px] text-amber-600 mt-1">Menunggu Review HRD</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Nilai Rata-rata per Kriteria over weeks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tren Nilai Rata-rata per Kriteria SMART
              </h3>
              <p className="text-xs text-slate-500">
                Perkembangan performa 3 Kriteria Benefit (C1, C2, C3) selama 4 minggu
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Bulan Ini
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="Kehadiran"
                  name="C1 - Kehadiran (30%)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="KetepatanWaktu"
                  name="C2 - Ketepatan Waktu (20%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tugas"
                  name="C3 - Penyelesaian Tugas (50%)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Distribusi Peringkat */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Distribusi Peringkat Mahasiswa
            </h3>
            <p className="text-xs text-slate-500">
              Komposisi hasil evaluasi SMART
            </p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                25
              </span>
              <span className="text-[10px] text-slate-400">Mahasiswa</span>
            </div>
          </div>
        </div>
      </div>



      {/* Bottom Role-Tailored Action Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isSuperAdmin ? (
          <>
            <Link
              to="/admin/audit-log"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Pengawasan &amp; Audit Log</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pantau seluruh catatan evaluasi dan pengesahan nilai akhir
              </p>
            </Link>

            <Link
              to="/admin/hasil-peringkat"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pengesahan Juara 1 &amp; Peringkat
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trophy Peringkat 1 (Andi Pratama: 0.92) siap disahkan
              </p>
            </Link>

            <Link
              to="/admin/mahasiswa"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Rekapitulasi Berkas Mahasiswa
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola file data lengkap dalam bentuk CSV / JSON
              </p>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/admin/input-penilaian"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Input Penilaian Matriks
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Input nilai kedisiplinan dan kinerja PKL
              </p>
            </Link>

            <Link
              to="/admin/perhitungan-smart"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Jalankan Perhitungan SMART
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Hitung normalisasi bobot dan nilai utilitas secara otomatis
              </p>
            </Link>

            <Link
              to="/admin/hasil-peringkat"
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Hasil &amp; Peringkat
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lihat hasil akhir dan kirimkan draft ke Founder
              </p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
