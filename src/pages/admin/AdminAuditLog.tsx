import React, { useState } from 'react';
import {
  Crown,
  History,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useQuery } from '../../hooks/useData';
import { AuditLogHistory } from '../../components/admin/AuditLogHistory';
import { usePeriode } from '../../hooks/usePeriode';

export const AdminAuditLog: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { periodeAktif } = usePeriode();
  const { data: logs = [], error, refetch } = useQuery(() => authService.getAuditLogs());
  const [certifiedNotice, setCertifiedNotice] = useState(false);

  const handleFounderCertification = async () => {
    try {
      if (!periodeAktif) throw new Error('Belum ada periode PKL aktif.');
      await authService.certifyRanking(periodeAktif.nama_periode);
      await refetch();
      setCertifiedNotice(true);
      setTimeout(() => setCertifiedNotice(false), 3500);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengesahkan hasil.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pengawasan &amp; Audit Log Founder
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Kuasa Penuh Pemilik
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Portal pengawasan independen bagi Founder PT Seven Inc. untuk memantau integritas operasional penilaian HRD.
          </p>
        </div>

        {/* Action Button: Pengesahan Eksekutif */}
        <button
          onClick={handleFounderCertification}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
        >
          <FileCheck className="w-4 h-4" />
          <span>Sahkan Nilai &amp; Terbitkan Sertifikat</span>
        </button>
      </div>

      {certifiedNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Seluruh hasil penilaian kedisiplinan SMART mahasiswa PKL telah berhasil disahkan secara sah oleh Founder PT Seven Inc.!
          </span>
        </div>
      )}

      {/* 2-Card Founder Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hak Akses Eksekutif (Kuasa Penuh)
              </h3>
              <p className="text-xs text-slate-500">
                Founder memegang otoritas tertinggi penetapan bobot SMART &amp; verifikasi kelulusan
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            Sebagai pemilik perusahaan, Anda dapat melihat seluruh riwayat audit perubahan data yang dilakukan oleh tim HRD, mengesahkan peringkat akhir, serta mengunduh basis data mahasiswa PKL.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pengawasan Operasional HRD
              </h3>
              <p className="text-xs text-slate-500">
                Aktivitas HRD dicatat otomatis melalui Supabase
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            Tim HRD bertugas melakukan input penilaian harian, mengelola periode magang, dan menjalankan perhitungan matematis SMART.
          </p>
        </div>
      </div>

      <AuditLogHistory logs={logs ?? []} onChanged={refetch} />
    </div>
  );
};
