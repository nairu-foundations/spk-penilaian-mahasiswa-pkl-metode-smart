import React from 'react';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Briefcase,
  Award,
  ShieldCheck,
  Building2,
  LogOut,
  FileCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { spkService } from '../../services/spkService';
import { jalankanSMARTMahasiswa } from '../../utils/smart';
import { Skeleton } from '../../components/common/Skeleton';
import { useNavigate } from 'react-router-dom';

export const DashboardMahasiswa: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: mahasiswaList, loading: loadingMhs } = useQuery(() =>
    authService.getMahasiswaPKLList()
  );
  const { data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());

  const isLoading = loadingMhs || loadingKrit;

  const smartResult = React.useMemo(() => {
    if (!mahasiswaList || !kriteriaList) return null;
    try {
      return jalankanSMARTMahasiswa({
        mahasiswaList,
        kriteriaList,
      });
    } catch {
      return null;
    }
  }, [mahasiswaList, kriteriaList]);

  // Match current logged-in student
  const currentStudent = React.useMemo(() => {
    if (!smartResult) return null;
    const found = smartResult.ranking.find(
      (m) =>
        m.email.toLowerCase() === user.email?.toLowerCase() ||
        m.nim === user.nim ||
        m.nama.toLowerCase() === user.nama.toLowerCase()
    );
    return found || smartResult.ranking[0]; // fallback to top student
  }, [smartResult, user]);

  const studentEmail = currentStudent?.email || user.email || 'andi.pratama@mail.ugm.ac.id';
  const studentName = currentStudent?.nama || user.nama || 'Andi Pratama';
  const studentDept = currentStudent?.bagian || user.bagian || 'IT / Software Engineering';
  const studentInst = currentStudent?.institusi || user.institusi || 'PT Seven Inc.';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Student Header Card - STRICTLY NO DOWNLOAD / UNDUH BUTTON */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-900/30 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Portal Mahasiswa PKL
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> PT Seven Inc.
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {studentName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Email: {studentEmail} · Penempatan: {studentDept} · {studentInst}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Notice strictly separating from Admin */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Akun Mahasiswa memiliki akses terbatas untuk melihat transkrip penilaian kedisiplinan dan peringkat mandiri di <strong>PT Seven Inc.</strong> Dashboard Admin hanya dapat diakses oleh HRD dan Founder.
          </span>
        </div>
      </div>

      {/* Main Student Performance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Overall SMART Score */}
        <div className="md:col-span-2 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 rounded-2xl p-6 sm:p-8 border border-amber-200 dark:border-amber-900/40 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Hasil Evaluasi Metode SMART
                </span>
                <Award className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Peringkat #{currentStudent?.peringkat} dari {smartResult?.ranking.length || 5} Mahasiswa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dihitung berdasarkan pembobotan ilmiah SMART 3 Kriteria Benefit PT Seven Inc.
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600 flex items-center justify-center font-bold text-2xl shrink-0">
              {currentStudent?.peringkat === 1 ? <Trophy className="w-9 h-9" /> : `#${currentStudent?.peringkat}`}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-amber-200/60 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500">Nilai Akhir (Vi)</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                {currentStudent?.skor_akhir.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Skala Nilai 0-100</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {currentStudent?.nilai_skala_100.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Predikat Kinerja</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {currentStudent?.keterangan}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Personal Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Status Magang Aktif</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Program Magang PKL Periode 1 - 2025
            </p>
          </div>

          <div className="space-y-3 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Perusahaan</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">PT Seven Inc.</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>Divisi</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] text-right">
                {studentDept}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Waktu Pelaksanaan</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">Jan - Jun 2025</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            Data penilaian Anda dievaluasi secara berkala oleh pembimbing dan HRD PT Seven Inc. menggunakan bobot resmi metode SMART.
          </div>
        </div>
      </div>

      {/* 3 Criteria Evaluation Breakdown */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span>Rincian 3 Kriteria Penilaian Mahasiswa PKL</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Berikut adalah nilai Anda pada 3 kriteria benefit utama beserta kontribusinya terhadap skor akhir SMART
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* C1: Kehadiran */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                  C1 · Benefit
                </span>
                <span className="text-xs font-bold text-blue-600">
                  Bobot: 30% (0.30)
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                Kehadiran
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Menilai tingkat partisipasi mahasiswa selama periode PKL. Semakin tinggi tingkat kehadiran, semakin baik nilai yang diperoleh.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nilai Mentah</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {currentStudent?.nilai_mentah.C1 ?? 95}
                  <span className="text-xs font-normal text-slate-400"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Kontribusi SMART</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  +{currentStudent?.kontribusi.C1.toFixed(4) ?? '0.2850'}
                </p>
              </div>
            </div>
          </div>

          {/* C2: Ketepatan Waktu */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                  C2 · Benefit
                </span>
                <span className="text-xs font-bold text-blue-600">
                  Bobot: 20% (0.20)
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                Ketepatan Waktu
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Menilai kedisiplinan dalam mengikuti jadwal masuk dan ketentuan waktu kerja di PT Seven Inc.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nilai Mentah</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {currentStudent?.nilai_mentah.C2 ?? 90}
                  <span className="text-xs font-normal text-slate-400"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Kontribusi SMART</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  +{currentStudent?.kontribusi.C2.toFixed(4) ?? '0.1800'}
                </p>
              </div>
            </div>
          </div>

          {/* C3: Penyelesaian Tugas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                  C3 · Benefit
                </span>
                <span className="text-xs font-bold text-blue-600">
                  Bobot: 50% (0.50)
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                Penyelesaian Tugas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Menilai tanggung jawab mahasiswa dalam menyelesaikan pekerjaan yang diberikan selama periode penilaian PKL.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Nilai Mentah</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {currentStudent?.nilai_mentah.C3 ?? 92}
                  <span className="text-xs font-normal text-slate-400"> / 100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Kontribusi SMART</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  +{currentStudent?.kontribusi.C3.toFixed(4) ?? '0.4600'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
