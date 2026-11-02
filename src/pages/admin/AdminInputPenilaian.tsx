import React, { useState } from 'react';
import { Search, Save, Check, HelpCircle, RotateCcw, Calculator } from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { spkService } from '../../services/spkService';
import { jalankanSMARTMahasiswa } from '../../utils/smart';
import { Skeleton } from '../../components/common/Skeleton';
import { MahasiswaPKL } from '../../types';

export const AdminInputPenilaian: React.FC = () => {
  const { error: mahasiswaError, data: mahasiswaList, loading: loadingMhs, refetch: refetchMhs } = useQuery(() =>
    authService.getMahasiswaPKLList()
  );
  const { error: kriteriaError, data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());

  const [search, setSearch] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('Periode 1 - 2025');
  const [localScores, setLocalScores] = useState<Record<string, Record<string, number>>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isLoading = loadingMhs || loadingKrit;

  // Active 3 criteria sorted
  const activeKriteria = (kriteriaList || [])
    .filter((k) => k.aktif)
    .sort((a, b) => a.urutan - b.urutan);

  // Helper to get score for a student & criterion
  const getScore = (mhs: MahasiswaPKL, kodeKriteria: string): number => {
    if (localScores[mhs.id] && localScores[mhs.id][kodeKriteria] !== undefined) {
      return localScores[mhs.id][kodeKriteria];
    }
    if (mhs.nilai_kriteria && mhs.nilai_kriteria[kodeKriteria] !== undefined) {
      return mhs.nilai_kriteria[kodeKriteria];
    }
    return 0;
  };

  const handleScoreChange = (mhsId: string, kodeKriteria: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    setLocalScores((prev) => ({
      ...prev,
      [mhsId]: {
        ...(prev[mhsId] || {}),
        [kodeKriteria]: clamped,
      },
    }));
  };

  // Save single student assessment
  const handleSaveStudent = async (mhs: MahasiswaPKL) => {
    try {
      if (!kriteriaList) return;

      const scores: Record<string, number> = {};
      activeKriteria.forEach((k) => {
        scores[k.kode] = getScore(mhs, k.kode);
      });

      const updatedMhs: MahasiswaPKL = {
        ...mhs,
        nilai_kriteria: scores,
      };

      // Recalculate SMART scores for this student
      const smartCalc = jalankanSMARTMahasiswa({
        mahasiswaList: [updatedMhs],
        kriteriaList,
      });
      const resultItem = smartCalc.matriksKeputusan[0];
      if (resultItem) {
        updatedMhs.utility = resultItem.utilitas;
        updatedMhs.skor_akhir_smart = resultItem.skor_akhir;
        updatedMhs.nilai_skala_100 = resultItem.nilai_skala_100;
        updatedMhs.keterangan_nilai = resultItem.keterangan;
      }

      await authService.saveMahasiswaPKL(updatedMhs);
      setLocalScores(prev => { const next = {...prev}; delete next[mhs.id]; return next; });
      setSavedSuccessId(mhs.id);
      setTimeout(() => setSavedSuccessId(null), 2500);
      await refetchMhs();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Save all students assessments at once
  const handleSaveAll = async () => {
    try {
      if (!mahasiswaList || !kriteriaList) return;

      const updates = mahasiswaList.map((mhs) => {
        const scores = Object.fromEntries(activeKriteria.map((k) => [k.kode, getScore(mhs, k.kode)]));
        return { ...mhs, nilai_kriteria: scores };
      });
      await authService.importMahasiswaPKL(updates);

      setLocalScores({});
      setSaveAllSuccess(true);
      setTimeout(() => setSaveAllSuccess(false), 3000);
      await refetchMhs();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Reset to benchmark case study (A1 - A5)
  const handleResetBenchmark = async () => {
    try {
      if (!window.confirm('Kosongkan seluruh nilai penilaian pada database? Identitas mahasiswa tetap dipertahankan.')) return;
      await authService.resetMahasiswaPKLList();

      setLocalScores({});
      setLocalScores({});
      setSaveAllSuccess(true);
      setTimeout(() => setSaveAllSuccess(false), 2500);
      await refetchMhs();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  const filteredMahasiswa = (mahasiswaList || []).filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.bagian.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {(mahasiswaError || kriteriaError) && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{mahasiswaError || kriteriaError}</div>}
      {/* Header matching Mockup Screen 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Input Penilaian
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Input Penilaian Mahasiswa PKL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showGuide ? 'Tutup Rubrik 3 Kriteria' : 'Rubrik Penilaian 3 Kriteria'}</span>
          </button>

          <button
            onClick={handleResetBenchmark}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
            title="Kembalikan ke Nilai Kasus Uji Kasus A1-A5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Nilai</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            {saveAllSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveAllSuccess ? 'Semua Tersimpan!' : 'Simpan Semua'}</span>
          </button>
        </div>
      </div>

      {/* Guide Card if toggled */}
      {showGuide && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Pedoman 3 Kriteria Penilaian Mahasiswa PKL PT Seven Inc.
            </h4>
            <span className="text-[11px] text-blue-600 font-medium">Skala Penilaian: 0 – 100 (Benefit)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-600">C1: Kehadiran</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Bobot 30%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Menilai tingkat presensi dan keterlibatan harian selama jam operasional PKL. Semakin tinggi kehadiran, nilai semakin mendekati 100.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-600">C2: Ketepatan Waktu</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Bobot 20%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Menilai kedisiplinan jadwal masuk dan kepatuhan jam kerja. Dikonversi ke skor benefit: 0 keterlambatan = nilai 95-100.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-600">C3: Penyelesaian Tugas</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Bobot 50%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Prioritas utama yang menilai tanggung jawab penuntasan tugas proyek PKL sesuai target dan standar mutu PT Seven Inc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar matching Screen 6 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-60">
          <label className="block text-xs font-medium text-slate-500 mb-1">Periode</label>
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Periode 1 - 2025">Periode 1 - 2025 (Aktif)</option>
            <option value="Periode 2 - 2025">Periode 2 - 2025</option>
            <option value="Periode 1 - 2024">Periode 1 - 2024</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Cari Mahasiswa</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, atau bagian divisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Matrix Table matching Screen 6 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Mahasiswa</th>
                  {activeKriteria.map((krit) => (
                    <th key={krit.id} className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {krit.kode}
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                          {krit.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Bobot: {krit.bobot_awal}%)
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMahasiswa.map((mhs, idx) => (
                  <tr
                    key={mhs.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {mhs.kode_alternatif || `A${idx + 1}`}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {mhs.nama}
                          </p>
                          <p className="text-xs text-slate-400">
                            Email: {mhs.email || mhs.nim} · {mhs.bagian}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Criteria Value Inputs (0 - 100) */}
                    {activeKriteria.map((krit) => {
                      const val = getScore(mhs, krit.kode);
                      return (
                        <td key={krit.id} className="py-2 px-3 text-center">
                          <div className="inline-flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) =>
                                handleScoreChange(mhs.id, krit.kode, Number(e.target.value))
                              }
                              className="w-16 text-center py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 tabular-nums text-slate-900 dark:text-white"
                            />
                          </div>
                        </td>
                      );
                    })}

                    {/* Save Action matching Screen 6 */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSaveStudent(mhs)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          savedSuccessId === mhs.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                        }`}
                        title="Simpan Baris Penilaian Ini"
                      >
                        {savedSuccessId === mhs.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Tersimpan
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Simpan
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary note below table */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Setiap nilai yang disimpan akan langsung dihitung otomatis ke <strong>Perhitungan SMART</strong> menggunakan rumus baku normalisasi bobot $w_j$ dan utilitas skala 0-100.
          </span>
        </div>
      </div>
    </div>
  );
};
