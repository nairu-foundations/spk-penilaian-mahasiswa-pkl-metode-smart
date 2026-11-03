import { CloudDownload } from '../components/common/CloudDownload';
import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Target,
  GraduationCap,
  Printer,
  FileSpreadsheet,
  FileCode,
  UserPlus,
  Edit3,
  RotateCcw,
  CheckCircle2,
  X,
  Check,
  Calculator,
} from 'lucide-react';
import { useQuery } from '../hooks/useData';
import { contentService } from '../services/contentService';
import { authService } from '../services/authService';
import { spkService } from '../services/spkService';
import { jalankanSMARTMahasiswa } from '../utils/smart';
import { Skeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { MahasiswaPKL } from '../types';
import { usePeriode } from '../hooks/usePeriode';
import { rentangPeriode } from '../utils/periode';

export const LandingPage: React.FC = () => {
  const { isMahasiswa, isAdminHRD, isSuperAdmin } = useAuth();
  const { error: mahasiswaError,
    data: mahasiswaList,
    loading: loadingMhs,
    refetch: refetchMhs,
  } = useQuery(() => authService.getMahasiswaPKLList());
  const { error: kriteriaError, data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());

  const { data: hero } = useQuery(() => contentService.getHero());

  const { selectedPeriode, selectedPeriod } = usePeriode();

  // Input Data ke Perhitungan SMART Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstitusi, setFormInstitusi] = useState('PT Seven Inc.');
  const [formBagian, setFormBagian] = useState('IT / Software Engineering');
  const [formC1, setFormC1] = useState<number>(90);
  const [formC2, setFormC2] = useState<number>(90);
  const [formC3, setFormC3] = useState<number>(85);
  const [notification, setNotification] = useState<string | null>(null);

  const isLoading = loadingMhs || loadingKrit;

  // Run dynamic calculation for Mahasiswa PKL
  const smartResult = useMemo(() => {
    if (!mahasiswaList || !kriteriaList) return null;
    try {
      return jalankanSMARTMahasiswa({
        mahasiswaList: mahasiswaList.filter(student => student.periode === selectedPeriode),
        kriteriaList,
      });
    } catch {
      return null;
    }
  }, [mahasiswaList, kriteriaList, selectedPeriode]);

  const top1 = smartResult?.ranking[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!smartResult) return;
    const headers = [
      'Peringkat',
      'Kode Alternatif',
      'Email Mahasiswa',
      'Nama Mahasiswa',
      'Institusi',
      'Bagian / Divisi',
      'Kehadiran (C1)',
      'Ketepatan Waktu (C2)',
      'Penyelesaian Tugas (C3)',
      'Nilai Akhir SMART (Vi)',
      'Nilai Skala 100',
      'Keterangan',
    ].join(',');

    const rows = smartResult.ranking.map((item) =>
      [
        item.peringkat,
        item.kode_alternatif,
        `"${item.email || item.nim}"`,
        `"${item.nama}"`,
        `"${item.institusi || '-'}"`,
        `"${item.bagian}"`,
        item.nilai_mentah.C1,
        item.nilai_mentah.C2,
        item.nilai_mentah.C3,
        item.skor_akhir.toFixed(4),
        item.nilai_skala_100.toFixed(2),
        `"${item.keterangan}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `Hasil_Peringkat_Mahasiswa_PKL_${selectedPeriode.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    if (!smartResult) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(smartResult.ranking, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'hasil_peringkat_mahasiswa_pkl.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Open modal to add a new candidate into SMART
  const handleOpenAddModal = () => {
    setEditingStudentId(null);
    const nextNum = (mahasiswaList?.length ?? 0) + 1;
    setFormNama('');
    setFormEmail(`mahasiswa${nextNum}@mail.ac.id`);
    setFormInstitusi('Universitas Gadjah Mada');
    setFormBagian('IT / Software Engineering');
    setFormC1(92);
    setFormC2(88);
    setFormC3(90);
    setIsModalOpen(true);
  };

  // Open modal to edit existing candidate
  const handleOpenEditModal = (mhsId: string) => {
    const student = mahasiswaList?.find((m) => m.id === mhsId);
    if (!student) return;

    setEditingStudentId(student.id);
    setFormNama(student.nama);
    setFormEmail(student.email || `${student.nim}@mail.ac.id`);
    setFormInstitusi(student.institusi || 'PT Seven Inc.');
    setFormBagian(student.bagian || 'IT / Software Engineering');

    const calcItem = smartResult?.ranking.find((m) => m.id === student.id);
    setFormC1(calcItem?.nilai_mentah.C1 ?? student.nilai_kriteria?.C1 ?? 85);
    setFormC2(calcItem?.nilai_mentah.C2 ?? student.nilai_kriteria?.C2 ?? 85);
    setFormC3(calcItem?.nilai_mentah.C3 ?? student.nilai_kriteria?.C3 ?? 85);
    setIsModalOpen(true);
  };

  // Submit Modal: Save and Recalculate
  const handleSaveStudentModal = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!formNama.trim() || !formEmail.trim()) {
        alert('Mohon lengkapi nama dan email mahasiswa.');
        return;
      }

      const c1 = Math.max(0, Math.min(100, Number(formC1) || 0));
      const c2 = Math.max(0, Math.min(100, Number(formC2) || 0));
      const c3 = Math.max(0, Math.min(100, Number(formC3) || 0));

      let targetStudent: MahasiswaPKL;
      if (editingStudentId) {
        const existing = mahasiswaList?.find((m) => m.id === editingStudentId);
        targetStudent = {
          ...existing!,
          nama: formNama.trim(),
          email: formEmail.trim(),
          institusi: formInstitusi.trim(),
          bagian: formBagian.trim(),
          nilai_kriteria: { C1: c1, C2: c2, C3: c3 },
        };
      } else {
        if (!selectedPeriod) throw new Error('Periode PKL belum tersedia.');
        const codeIndex = (mahasiswaList?.length ?? 0) + 1;
        targetStudent = {
          id: `mhs-${Date.now()}`,
          nama: formNama.trim(),
          email: formEmail.trim(),
          nim: `2024100${codeIndex}`,
          institusi: formInstitusi.trim(),
          bagian: formBagian.trim(),
          periode: selectedPeriode,
          kode_alternatif: `A${codeIndex}`,
          status: 'Aktif',
          tanggal_mulai: selectedPeriod.tanggal_mulai,
          tanggal_selesai: selectedPeriod.tanggal_selesai,
          no_hp: '081234567890',
          nilai_kriteria: { C1: c1, C2: c2, C3: c3 },
        };
      }

      await authService.saveMahasiswaPKL(targetStudent);
      await refetchMhs();
      setIsModalOpen(false);

      setNotification(`Data ${targetStudent.nama} berhasil dimasukkan ke dalam perhitungan SMART!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Reset to original benchmark
  const handleResetDefaults = async () => {
    try {
      if (confirm('Kosongkan seluruh nilai penilaian? Identitas mahasiswa tetap dipertahankan.')) {
        await authService.resetMahasiswaPKLList();
        await refetchMhs();
        setNotification('Seluruh nilai penilaian telah dikosongkan di database.');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Real-time calculation simulation inside modal
  const modalSimulation = useMemo(() => {
    const c1 = Number(formC1) || 0;
    const c2 = Number(formC2) || 0;
    const c3 = Number(formC3) || 0;

    const u1 = c1 / 100;
    const u2 = c2 / 100;
    const u3 = c3 / 100;

    const vi = 0.3 * u1 + 0.2 * u2 + 0.5 * u3;
    const skala100 = vi * 100;

    let keterangan = 'Kurang';
    if (skala100 >= 85) keterangan = 'Sangat Baik';
    else if (skala100 >= 75) keterangan = 'Baik';
    else if (skala100 >= 60) keterangan = 'Cukup';

    return { u1, u2, u3, vi, skala100, keterangan };
  }, [formC1, formC2, formC3]);

  return (
    <div className="space-y-16 pb-20">
      {(mahasiswaError || kriteriaError) && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{mahasiswaError || kriteriaError}</div>}
      {/* 1. HERO HEADER: FOCUS ON MAHASISWA PKL EVALUATION */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold mb-6">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Sistem Penunjang Keputusan Mahasiswa PKL · PT Seven Inc.</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {hero?.judul ?? 'Penilaian Kedisiplinan & Kinerja Mahasiswa PKL Metode SMART'}
          </h1>

          {hero?.subjudul && <p className="mt-4 max-w-3xl mx-auto text-slate-300">{hero.subjudul}</p>}

          {/* Quick Action Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={hero?.link_tombol_utama ?? '#hasil-peringkat'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>{hero?.teks_tombol_utama ?? 'Lihat Hasil & Peringkat Mahasiswa'}</span>
            </a>

            {(isAdminHRD || isSuperAdmin) && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Masukkan Data ke SMART</span>
              </button>
            )}

            {(isAdminHRD || isSuperAdmin) && (
              <CloudDownload
                format="csv"
                className="px-4 py-3 bg-emerald-700/80 hover:bg-emerald-700 border border-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Berkas CSV</span>
              </CloudDownload>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 max-w-xl mx-auto flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span>Periode: {rentangPeriode(selectedPeriod)} (1 bulan)</span>
            <span aria-hidden="true">&middot;</span>
            <span>Total: {mahasiswaList?.length ?? 0} Mahasiswa Aktif</span>
            <span aria-hidden="true">&middot;</span>
            <span>PT Seven Inc.</span>
          </div>
        </div>
      </section>

      {/* HASIL DAN PERINGKAT MAHASISWA PKL SECTION */}
      <section id="hasil-peringkat" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-8">
        {/* Notification Toast */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Hasil Evaluasi Akhir</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hasil &amp; Peringkat Mahasiswa PKL
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rekapitulasi skor SMART dan peringkat resmi mahasiswa {selectedPeriode} ({smartResult?.ranking.length ?? 0} Alternatif)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(isAdminHRD || isSuperAdmin) && (
              <>
                <button
                  onClick={handleResetDefaults}
                  title="Kosongkan nilai penilaian"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Masukkan Data ke SMART</span>
                </button>
              </>
            )}

            {(isAdminHRD || isSuperAdmin) && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors border border-slate-700"
                >
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span>Export JSON</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Golden Trophy Card Peringkat 1 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                    Peringkat 1 (Rekomendasi Terbaik)
                  </span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                    {top1?.keterangan || 'Belum dihitung'}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {top1 ? top1.nama : 'Belum ada hasil'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Email: {top1?.email || '?'}{[top1?.bagian, top1?.institusi].filter(Boolean).map((detail, i) => <span key={i}> ? {detail}</span>)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center sm:text-right">
                <p className="text-xs text-slate-500">Nilai Akhir SMART (Vi)</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {top1 ? top1.skor_akhir.toFixed(4) : '?'}
                </p>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  Skala 100: {top1 ? top1.nilai_skala_100.toFixed(2) : '?'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                1
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Tabel Peringkat Mahasiswa Peserta PKL PT Seven Inc.
            </span>
            <span className="font-mono">{selectedPeriode || 'Belum ada periode'}</span>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !smartResult ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada data perhitungan mahasiswa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3.5 px-4 w-16 text-center">Peringkat</th>
                    <th className="py-3.5 px-4">Nama Mahasiswa</th>
                    <th className="py-3.5 px-4 text-center font-mono">Kehadiran (C1)</th>
                    <th className="py-3.5 px-4 text-center font-mono">Ketepatan Waktu (C2)</th>
                    <th className="py-3.5 px-4 text-center font-mono">Penyelesaian Tugas (C3)</th>
                    <th className="py-3.5 px-4 text-center font-bold text-blue-600">Nilai Akhir (Vi)</th>
                    <th className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">Skala 100</th>
                    <th className="py-3.5 px-4 text-center">Keterangan</th>
                    {(isAdminHRD || isSuperAdmin) && <th className="py-3.5 px-4 text-center w-20">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {smartResult.ranking.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                            item.peringkat === 1
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 shadow-xs'
                              : item.peringkat === 2
                              ? 'bg-slate-200 text-slate-800'
                              : item.peringkat === 3
                              ? 'bg-amber-50 text-amber-900'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.peringkat}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {item.kode_alternatif}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.nama}
                            </p>
                            <p className="text-xs text-slate-400">
                              Email: {item.email || item.nim} · {item.bagian} · {item.institusi}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                        {item.nilai_mentah.C1}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                        {item.nilai_mentah.C2}
                      </td>

                      <td className="py-4 px-4 text-center font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                        {item.nilai_mentah.C3}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                        {item.skor_akhir.toFixed(4)}
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {item.nilai_skala_100.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            item.keterangan === 'Sangat Baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.keterangan === 'Baik'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.keterangan}
                        </span>
                      </td>

                      {(isAdminHRD || isSuperAdmin) && (
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleOpenEditModal(item.id)}
                            title="Edit nilai kriteria mahasiswa ini"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* MODAL: INPUT DATA KE PERHITUNGAN SMART */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingStudentId ? 'Edit Nilai Mahasiswa di SMART' : 'Masukkan Data ke Perhitungan SMART'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input nilai kriteria C1, C2, C3 untuk dihitung langsung dengan metode SMART.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Mahasiswa PKL *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Eko Prasetyo"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Mahasiswa *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: eko.prasetyo@mail.ac.id"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institusi / Perguruan Tinggi
                  </label>
                  <input
                    type="text"
                    value={formInstitusi}
                    onChange={(e) => setFormInstitusi(e.target.value)}
                    placeholder="Contoh: Universitas Gadjah Mada"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Divisi Penempatan di PT Seven Inc.
                  </label>
                  <select
                    value={formBagian}
                    onChange={(e) => setFormBagian(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="IT / Software Engineering">IT / Software Engineering</option>
                    <option value="Human Resources / HRD">Human Resources / HRD</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Multimedia & Content">Multimedia & Content</option>
                  </select>
                </div>
              </div>

              {/* 3 Benefit Criteria Score Inputs */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nilai 3 Kriteria Benefit (Skala 0 - 100)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C1: Kehadiran
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC1}
                        disabled={!!mahasiswaList?.find(student => student.id === editingStudentId)?.rekap_bulanan}
                        onChange={(e) => setFormC1(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 30%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C2: Ketepatan Waktu
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC2}
                        disabled={!!mahasiswaList?.find(student => student.id === editingStudentId)?.rekap_bulanan}
                        onChange={(e) => setFormC2(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 20%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C3: Tugas
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC3}
                        disabled={!!mahasiswaList?.find(student => student.id === editingStudentId)?.rekap_bulanan}
                        onChange={(e) => setFormC3(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 50%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Simulation Inside Modal */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Estimasi Nilai Vi</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {modalSimulation.vi.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Skala 100</p>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {modalSimulation.skala100.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Predikat</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {modalSimulation.keterangan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan &amp; Masukkan ke Perhitungan SMART</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
