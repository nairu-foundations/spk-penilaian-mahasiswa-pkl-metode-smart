import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { spkService } from '../../services/spkService';
import { PeriodePKL } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminPeriode: React.FC = () => {
  const { error, data: list, loading, refetch } = useQuery(() => spkService.getPeriode());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeriodePKL | null>(null);

  const [formNama, setFormNama] = useState('');
  const [formMulai, setFormMulai] = useState('');
  const [formSelesai, setFormSelesai] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNama('');
    setFormMulai('');
    setFormSelesai('');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PeriodePKL) => {
    setEditingItem(item);
    setFormNama(item.nama_periode);
    setFormMulai(item.tanggal_mulai);
    setFormSelesai(item.tanggal_selesai);
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!formNama.trim() || !formMulai || !formSelesai) return;

      await spkService.savePeriode({
        id: editingItem?.id || '',
        nama_periode: formNama.trim(),
        tanggal_mulai: formMulai,
        tanggal_selesai: formSelesai,
        status: formStatus,
      });

      setIsModalOpen(false);
      await refetch();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {/* Header matching Screen 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Periode PKL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Periode PKL
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Periode</span>
        </button>
      </div>

      {/* Table matching Screen 4 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Periode</th>
                  <th className="py-3 px-4">Tanggal Mulai</th>
                  <th className="py-3 px-4">Tanggal Selesai</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(list || []).map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.nama_periode}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {item.tanggal_mulai}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {item.tanggal_selesai}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Periode PKL' : 'Tambah Periode PKL'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Periode
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="e.g. Periode 1 - 2025"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={formMulai}
                onChange={(e) => setFormMulai(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                required
                value={formSelesai}
                onChange={(e) => setFormSelesai(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status Periode
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as 'Aktif' | 'Nonaktif')}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="Aktif">Aktif (Bisa Mendaftar)</option>
              <option value="Nonaktif">Nonaktif (Arsip/Selesai)</option>
            </select>
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
              Simpan Periode
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
