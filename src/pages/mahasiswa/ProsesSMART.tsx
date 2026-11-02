import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Sliders,
  Trophy,
  CheckCircle,
  HelpCircle,
  Send,
  Save,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useQuery } from '../../hooks/useData';
import { spkService } from '../../services/spkService';
import { pengajuanService } from '../../services/pengajuanService';
import { useAuth } from '../../context/AuthContext';
import { jalankanSMART, SMARTResult } from '../../utils/smart';
import { HasilDetail } from '../../types';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';

export const ProsesSMART: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());
  const { data: alternatifList, loading: loadingAlt } = useQuery(() => spkService.getAlternatif());
  const { data: nilaiList, loading: loadingNilai } = useQuery(() => spkService.getNilaiMatrix());

  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [calculationResult, setCalculationResult] = useState<SMARTResult | null>(null);
  const [showTransparency, setShowTransparency] = useState(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Apply Modal state
  const [selectedMitraToApply, setSelectedMitraToApply] = useState<HasilDetail | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isLoading = loadingKrit || loadingAlt || loadingNilai;

  // Initialize weights from kriteriaList
  useEffect(() => {
    if (kriteriaList && Object.keys(customWeights).length === 0) {
      const initial: Record<string, number> = {};
      kriteriaList.forEach((k) => {
        initial[k.id] = Number(k.bobot_awal);
      });
      setCustomWeights(initial);
    }
  }, [kriteriaList, customWeights]);

  const handleSliderChange = (kriteriaId: string, val: number) => {
    setCustomWeights((prev) => ({
      ...prev,
      [kriteriaId]: val,
    }));
  };

  const handleResetWeights = () => {
    if (!kriteriaList) return;
    const initial: Record<string, number> = {};
    kriteriaList.forEach((k) => {
      initial[k.id] = Number(k.bobot_awal);
    });
    setCustomWeights(initial);
  };

  const handleCalculate = () => {
    if (!kriteriaList || !alternatifList || !nilaiList) return;
    try {
      const res = jalankanSMART({
        kriteria: kriteriaList,
        alternatif: alternatifList,
        nilai: nilaiList,
        bobotCustom: customWeights,
      });
      setCalculationResult(res);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kendala saat menghitung SMART.');
    }
  };

  // Run initial calculation once data loads
  useEffect(() => {
    if (kriteriaList && alternatifList && nilaiList && !calculationResult) {
      try {
        const res = jalankanSMART({
          kriteria: kriteriaList,
          alternatif: alternatifList,
          nilai: nilaiList,
        });
        setCalculationResult(res);
      } catch (err) {
        console.warn('Initial calculation error:', err);
      }
    }
  }, [kriteriaList, alternatifList, nilaiList, calculationResult]);

  const handleSaveResult = async () => {
    if (!calculationResult || !user) {
      if (!user) {
        alert('Silakan login terlebih dahulu untuk menyimpan riwayat perhitungan.');
        navigate('/login');
      }
      return;
    }

    await spkService.simpanHasil({
      userId: user.id,
      bobotSnapshot: customWeights,
      ranking: calculationResult.ranking,
    });

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleOpenApplyModal = (detail: HasilDetail) => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk mengajukan PKL.');
      navigate('/login');
      return;
    }
    setSelectedMitraToApply(detail);
    setApplyError(null);
    setIsApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedMitraToApply || !user) return;
    setApplying(true);
    setApplyError(null);

    try {
      await pengajuanService.ajukanPKL({
        userId: user.id,
        alternatifId: selectedMitraToApply.alternatif_id,
        skorSmart: selectedMitraToApply.skor_akhir,
      });
      setIsApplyModalOpen(false);
      navigate('/riwayat-pengajuan');
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : 'Gagal mengirim pengajuan PKL.');
    } finally {
      setApplying(false);
    }
  };

  const totalRawBobot = Object.values(customWeights).reduce((a, b) => a + Number(b), 0);

  // Prepare chart data for top 5 alternatives
  const chartData = (calculationResult?.ranking || []).slice(0, 6).map((item) => ({
    name: item.alternatif?.kode || 'A',
    perusahaan: item.alternatif?.nama_perusahaan || '',
    skor: item.skor_akhir,
    peringkat: item.peringkat,
  }));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Kalkulator Rekomendasi Tempat PKL (Metode SMART)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sesuaikan prioritas Anda pada setiap kriteria di bawah, lalu klik tombol &quot;Hitung Rekomendasi&quot;. Sistem akan meranking mitra paling cocok secara ilmiah.
        </p>
      </div>

      {/* Sliders Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pengaturan Bobot Kriteria Pribadi
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Total Bobot Mentah:{' '}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {totalRawBobot}
              </strong>
            </span>
            <button
              onClick={handleResetWeights}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset ke Standar Kampus
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(kriteriaList || [])
            .filter((k) => k.aktif)
            .map((k) => {
              const currentVal = customWeights[k.id] ?? k.bobot_awal;
              const normalizedVal =
                totalRawBobot > 0 ? (currentVal / totalRawBobot).toFixed(4) : '0';

              return (
                <div
                  key={k.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {k.kode}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {k.nama}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {k.deskripsi}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                        k.tipe === 'benefit'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {k.tipe}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Nilai Bobot:</span>
                      <span className="tabular-nums font-bold text-slate-900 dark:text-white">
                        {currentVal} (Normalisasi wj: {normalizedVal})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={currentVal}
                      onChange={(e) => handleSliderChange(k.id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              );
            })}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Kriteria <strong>Benefit</strong> dinilai semakin besar nilainya semakin baik. Kriteria <strong>Cost</strong> dinilai semakin kecil nilainya semakin baik.
            </span>
          </p>

          <button
            onClick={handleCalculate}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Hitung Rekomendasi</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {calculationResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Winner Golden Trophy Card */}
          {calculationResult.ranking.length > 0 && (
            <div className="relative overflow-hidden bg-linear-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
                    <Trophy className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                      Rekomendasi Utama (Peringkat 1)
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {calculationResult.ranking[0].alternatif?.nama_perusahaan}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {calculationResult.ranking[0].alternatif?.bidang} ·{' '}
                      {calculationResult.ranking[0].alternatif?.kota} · Kuota:{' '}
                      {calculationResult.ranking[0].alternatif?.kuota} Mahasiswa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Skor Akhir (Si)</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {calculationResult.ranking[0].skor_akhir.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenApplyModal(calculationResult.ranking[0])}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan PKL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Comparison */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <span>Grafik Perbandingan Skor Akhir Mitra Teratas</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi nilai akhir hasil kalkulasi SMART (skala 0.0000 - 1.0000)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: unknown) => [
                      typeof value === 'number' ? value.toFixed(4) : String(value),
                      'Skor Akhir (Si)',
                    ]}
                    labelFormatter={(label: any) => {
                      const item = chartData.find((d) => d.name === label);
                      return `${label} - ${item?.perusahaan || ''}`;
                    }}
                  />
                  <Bar dataKey="skor" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#2563eb' : index === 1 ? '#38bdf8' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking Table & Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tabel Peringkat Rekomendasi
                </h3>
                <p className="text-xs text-slate-500">
                  Urutan tempat PKL terbaik yang dihitung berdasarkan preferensi Anda
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Hasil Perhitungan</span>
                </button>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="mx-4 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Hasil perhitungan berhasil disimpan ke riwayat akun Anda!</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Tempat PKL (Mitra)</th>
                    <th className="py-3 px-4">Kota &amp; Kuota</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir (Si)</th>
                    <th className="py-3 px-4 text-center">Kategori</th>
                    <th className="py-3 px-4 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {calculationResult.ranking.map((item, idx) => (
                    <tr
                      key={item.alternatif_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.peringkat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.alternatif?.nama_perusahaan}
                        </p>
                        <p className="text-[11px] text-slate-400">{item.alternatif?.bidang}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {item.alternatif?.kota} ·{' '}
                        <span className="text-slate-400">Kuota {item.alternatif?.kuota}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {item.skor_akhir.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.kategori === 'Sangat Baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.kategori === 'Baik'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenApplyModal(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
                        >
                          Ajukan PKL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transparency Section (Prompt 6: Tabel Transparansi Bobot & Utilitas) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowTransparency(!showTransparency)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Rincian Transparansi Perhitungan SMART
                </h4>
                <p className="text-xs text-slate-500">
                  Lihat matriks nilai utilitas benefit/cost dan pembobotan matematis tanpa kotak hitam
                </p>
              </div>
              {showTransparency ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showTransparency && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                        <th className="py-2.5 px-3">Mitra</th>
                        {calculationResult.kriteriaAktif.map((k) => (
                          <th key={k.id} className="py-2.5 px-3 text-center">
                            {k.kode} ({k.tipe === 'benefit' ? 'B' : 'C'})
                            <div className="text-[10px] text-slate-400 font-normal">
                              wj: {calculationResult.bobotNormal[k.id]}
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center font-bold">Total Si</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {calculationResult.ranking.map((item) => (
                        <tr key={item.alternatif_id}>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {item.alternatif?.kode} - {item.alternatif?.nama_perusahaan}
                          </td>
                          {calculationResult.kriteriaAktif.map((k) => (
                            <td
                              key={k.id}
                              className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400"
                            >
                              u = {item.utilitas[k.id]?.toFixed(4)}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-center font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                            {item.skor_akhir.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ajukan PKL */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Ajukan PKL ke Mitra Ini"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Anda akan mengajukan penempatan magang PKL ke instansi berikut:
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1 text-xs">
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {selectedMitraToApply?.alternatif?.nama_perusahaan}
            </p>
            <p className="text-slate-500">
              Bidang: {selectedMitraToApply?.alternatif?.bidang}
            </p>
            <p className="text-slate-500">
              Lokasi: {selectedMitraToApply?.alternatif?.alamat},{' '}
              {selectedMitraToApply?.alternatif?.kota}
            </p>
            <p className="text-blue-600 font-semibold pt-1">
              Skor SMART Anda: {selectedMitraToApply?.skor_akhir.toFixed(4)} (Peringkat{' '}
              {selectedMitraToApply?.peringkat})
            </p>
          </div>

          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {applyError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={handleConfirmApply}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {applying ? 'Mengirim...' : 'Kirim Pengajuan Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
