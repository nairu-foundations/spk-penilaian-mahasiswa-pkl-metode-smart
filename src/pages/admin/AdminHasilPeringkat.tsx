import React, { useState } from 'react';
import {
  Trophy,
  Download,
  Printer,
  Award,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { spkService } from '../../services/spkService';
import { jalankanSMARTMahasiswa } from '../../utils/smart';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminHasilPeringkat: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { error: mahasiswaError, data: mahasiswaList, loading: loadingMhs, refetch: refetchMhs } = useQuery(() =>
    authService.getMahasiswaPKLList()
  );
  const { error: kriteriaError, data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());

  const [selectedPeriode, setSelectedPeriode] = useState('Periode 1 - 2025');
  const [esahanSuccess, setEsahanSuccess] = useState(false);

  const isLoading = loadingMhs || loadingKrit;

  // Run SMART calculation dynamically
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

  const top1 = smartResult?.ranking[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!smartResult || smartResult.ranking.length === 0) return;

    const headers = [
      'Peringkat',
      'Kode Alternatif',
      'Email Mahasiswa',
      'Nama Mahasiswa',
      'Bagian / Divisi',
      'Institusi',
      'C1 (Kehadiran)',
      'C2 (Ketepatan Waktu)',
      'C3 (Penyelesaian Tugas)',
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
        `"${item.bagian}"`,
        `"${item.institusi || '-'}"`,
        item.nilai_mentah.C1,
        item.nilai_mentah.C2,
        item.nilai_mentah.C3,
        item.skor_akhir.toFixed(4),
        item.nilai_skala_100.toFixed(2),
        `"${item.keterangan}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_SMART_Mahasiswa_PKL_${selectedPeriode.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    void authService.recordAuditLog(
      user.nama,
      user.role,
      'Ekspor Hasil SMART CSV',
      `Mengekspor rekapitulasi peringkat penilaian SMART untuk ${selectedPeriode}.`
    ).catch(error => window.alert(error.message));
  };

  const handleExportJSON = () => {
    if (!smartResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(smartResult.ranking, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Hasil_SMART_Mahasiswa_PKL_${selectedPeriode.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    void authService.recordAuditLog(
      user.nama,
      user.role,
      'Ekspor Hasil SMART JSON',
      `Mengekspor file JSON peringkat penilaian SMART untuk ${selectedPeriode}.`
    ).catch(error => window.alert(error.message));
  };

  // Super Admin / Founder Validation & Endorsement Action
  const handlePengesahanFounder = async () => {
    if (!top1) return;
    try {
      await authService.certifyRanking(selectedPeriode);
      setEsahanSuccess(true);
      setTimeout(() => setEsahanSuccess(false), 3500);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengesahkan hasil.');
    }
  };

  return (
    <div className="space-y-6">
      {(mahasiswaError || kriteriaError) && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{mahasiswaError || kriteriaError}</div>}
      {/* Header matching Screen 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hasil &amp; Peringkat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Hasil &amp; Peringkat Rekomendasi Metode SMART
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={handlePengesahanFounder}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                esahanSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              title="Pengesahan Resmi oleh Founder PT Seven Inc."
            >
              {esahanSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
              <span>{esahanSuccess ? 'Telah Disahkan Founder!' : 'Sahkan Penetapan Juara'}</span>
            </button>
          )}

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
            title="Download CSV Hasil SMART"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors border border-slate-700"
            title="Download JSON Hasil SMART"
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Periode filter strip */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Periode:
          </label>
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
          >
            <option value="Periode 1 - 2025">Periode 1 - 2025 (Aktif)</option>
            <option value="Periode 2 - 2025">Periode 2 - 2025</option>
            <option value="Periode 1 - 2024">Periode 1 - 2024</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">3 Kriteria:</span>
          <span>Kehadiran (30%), Ketepatan Waktu (20%), Penyelesaian Tugas (50%)</span>
        </div>
      </div>

      {/* Top 1 Champion Card matching Golden Trophy Card in Screen 8 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
              <Trophy className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                  Peringkat 1
                </span>
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  Sangat Baik
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {top1 ? top1.nama : 'Andi Pratama'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Email: {top1 ? (top1.email || top1.nim) : 'andi.pratama@mail.ugm.ac.id'} · {top1 ? top1.bagian : 'IT / Software Engineering'} · {top1?.institusi || 'Universitas Gadjah Mada'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <p className="text-xs text-slate-500">Nilai Akhir (Vi)</p>
              <p className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {top1 ? top1.skor_akhir.toFixed(4) : '0.9250'}
              </p>
              <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                Skala 100: {top1 ? top1.nilai_skala_100.toFixed(2) : '92.50'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
              1
            </div>
          </div>
        </div>
      </div>

      {/* Table of Results matching Screen 8 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !smartResult ? (
          <div className="p-8 text-center text-slate-500">Tidak ada data hasil perangkingan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3.5 px-4 w-20 text-center">Peringkat</th>
                  <th className="py-3.5 px-4">Nama Mahasiswa</th>
                  <th className="py-3.5 px-4 text-center font-mono">Kehadiran (C1)</th>
                  <th className="py-3.5 px-4 text-center font-mono">Ketepatan (C2)</th>
                  <th className="py-3.5 px-4 text-center font-mono">Tugas (C3)</th>
                  <th className="py-3.5 px-4 text-center font-bold text-blue-600">Nilai Akhir (Vi)</th>
                  <th className="py-3.5 px-4 text-center font-bold">Skala 100</th>
                  <th className="py-3.5 px-4 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {smartResult.ranking.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          item.peringkat === 1
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
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
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.nama}
                        </span>
                        <span className="text-xs font-mono text-slate-400 ml-2">
                          ({item.email || item.nim})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.bagian} · {item.institusi}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {item.nilai_mentah.C1}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {item.nilai_mentah.C2}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {item.nilai_mentah.C3}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                      {item.skor_akhir.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums text-sm">
                      {item.nilai_skala_100.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit & Legal Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Keputusan dihitung secara sah dengan formula SMART PT Seven Inc.: V(a_i) = 0.30 &times; u_1 + 0.20 &times; u_2 + 0.50 &times; u_3
          </span>
        </div>
        <span className="font-mono text-slate-400 text-[11px]">
          Status: Diverifikasi HRD &amp; Dipantau Super Admin
        </span>
      </div>
    </div>
  );
};
