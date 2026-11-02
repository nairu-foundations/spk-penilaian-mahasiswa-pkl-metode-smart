import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { spkService } from '../../services/spkService';
import { Kriteria, KriteriaType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminKriteria: React.FC = () => {
  const { data: list, loading, error, refetch } = useQuery(() => spkService.getKriteria());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kriteria | null>(null);

  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formTipe, setFormTipe] = useState<KriteriaType>('benefit');
  const [formBobot, setFormBobot] = useState<number>(20);
  const [formDeskripsi, setFormDeskripsi] = useState('');

  const totalBobot = (list || []).reduce((sum, item) => sum + (item.aktif ? Number(item.bobot_awal) : 0), 0);
  const isBobot100 = totalBobot === 100;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormKode(`C${(list?.length || 0) + 1}`);
    setFormNama('');
    setFormTipe('benefit');
    setFormBobot(20);
    setFormDeskripsi('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Kriteria) => {
    setEditingItem(item);
    setFormKode(item.kode);
    setFormNama(item.nama);
    setFormTipe(item.tipe);
    setFormBobot(item.bobot_awal);
    setFormDeskripsi(item.deskripsi || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!formNama.trim() || !formKode.trim()) return;

      await spkService.saveKriteria({
        id: editingItem?.id || '',
        kode: formKode.trim().toUpperCase(),
        nama: formNama.trim(),
        tipe: formTipe,
        bobot_awal: Number(formBobot),
        deskripsi: formDeskripsi.trim(),
        urutan: editingItem?.urutan || (list?.length || 0) + 1,
        aktif: true,
      });

      setIsModalOpen(false);
      await refetch();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan kriteria.');
    }
  };

  const handleResetDefault = async () => {
    try {
      if (window.confirm('Pulihkan C1: Kehadiran 30%, C2: Ketepatan Waktu 20%, C3: Penyelesaian Tugas 50% di database? Kriteria tambahan tetap dipertahankan.')) {
        await spkService.resetKriteria();
        await refetch();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal memulihkan kriteria.');
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    try {
      if (window.confirm(`Hapus kriteria "${nama}"?`)) {
        await spkService.deleteKriteria(id);
        await refetch();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan kriteria.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>}
      {/* Header matching Screen 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kriteria dan Bobot SMART
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Kriteria &amp; Bobot Penilaian PKL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefault}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
            title="Reset ke 3 Kriteria Standar"
          >
            Reset 3 Kriteria (C1-C3)
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kriteria</span>
          </button>
        </div>
      </div>

      {/* Warning banner if not 100% */}
      {!isBobot100 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Total bobot saat ini adalah <strong>{totalBobot}%</strong>. Metode SMART membutuhkan total bobot bernilai 100% (atau dinormalisasi otomatis).
          </span>
        </div>
      )}

      {/* Table matching Screen 5 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Kriteria</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4 text-center">Bobot (%)</th>
                  <th className="py-3 px-4 text-center">Bobot Normal (wj)</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(list || []).map((item, idx) => {
                  const normalVal = totalBobot > 0 ? (item.bobot_awal / totalBobot).toFixed(4) : '0';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                            {item.kode}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.nama}
                            </span>
                            {item.deskripsi && (
                              <p className="text-xs text-slate-500 line-clamp-1">{item.deskripsi}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            item.tipe === 'benefit'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {item.tipe}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900 dark:text-white tabular-nums">
                        {item.bobot_awal}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                        {normalVal}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Bobot Strip matching Screen 5 */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Total Bobot
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold tabular-nums ${
                isBobot100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {totalBobot}%
            </span>
            {isBobot100 && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kode Kriteria
              </label>
              <input
                type="text"
                required
                value={formKode}
                onChange={(e) => setFormKode(e.target.value)}
                placeholder="C1, C2, etc."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jenis / Tipe
              </label>
              <select
                value={formTipe}
                onChange={(e) => setFormTipe(e.target.value as KriteriaType)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="benefit">Benefit (Nilai besar lebih baik)</option>
                <option value="cost">Cost (Nilai kecil lebih baik)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Kriteria
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="e.g. Kesesuaian Bidang dengan Prodi"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bobot (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={formBobot}
              onChange={(e) => setFormBobot(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={formDeskripsi}
              onChange={(e) => setFormDeskripsi(e.target.value)}
              placeholder="Penjelasan kriteria penilaian..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Simpan Kriteria
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
