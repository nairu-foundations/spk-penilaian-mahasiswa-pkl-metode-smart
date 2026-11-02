import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { pengajuanService } from '../../services/pengajuanService';
import { spkService } from '../../services/spkService';
import { authService } from '../../services/authService';
import { PengajuanPKL, StatusPengajuan } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminPengajuanPKL: React.FC = () => {
  const { data: pengajuanList, loading, refetch } = useQuery(() =>
    pengajuanService.getSemuaPengajuan()
  );
  const { data: alternatifList } = useQuery(() => spkService.getAlternatif());
  const { data: mahasiswaList } = useQuery(() => authService.getMahasiswaPKLList());

  const [filterStatus, setFilterStatus] = useState<'semua' | StatusPengajuan>('semua');
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanPKL | null>(null);
  const [actionType, setActionType] = useState<StatusPengajuan>('disetujui');
  const [catatan, setCatatan] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAction = (item: PengajuanPKL, type: StatusPengajuan) => {
    setSelectedPengajuan(item);
    setActionType(type);
    setCatatan(
      type === 'disetujui'
        ? 'Disetujui. Silakan unduh surat pengantar resmi pada portal akademik.'
        : 'Mohon maaf, kuota instansi mitra telah penuh atau tidak memenuhi prasyarat.'
    );
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPengajuan) return;

    await pengajuanService.updateStatusPengajuan(
      selectedPengajuan.id,
      actionType,
      catatan
    );

    setIsModalOpen(false);
    await refetch();
  };

  const filtered = (pengajuanList || []).filter((p) => {
    if (filterStatus === 'semua') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Penilaian &amp; Pengajuan PKL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Laporan Penilaian
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'semua' | StatusPengajuan)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Status</option>
            <option value="diajukan">Menunggu Verifikasi (Diajukan)</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">Belum ada pengajuan PKL pada status ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Mahasiswa</th>
                  <th className="py-3 px-4">Tempat PKL Dituju</th>
                  <th className="py-3 px-4 text-center">Skor SMART</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan Admin</th>
                  <th className="py-3 px-4 text-center w-28">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map((item) => {
                  const mhs =
                    item.mahasiswa ||
                    (mahasiswaList || []).find((m) => m.id === item.user_id) || {
                      nama: 'Mahasiswa PKL',
                      email: 'mahasiswa@seveninc.co.id',
                      nim: '20241001',
                      prodi: 'IT',
                    };
                  const alt =
                    item.alternatif ||
                    (alternatifList || []).find((a) => a.id === item.alternatif_id);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {mhs.nama}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {mhs.email || mhs.nim} · {'prodi' in mhs ? mhs.prodi : ('bagian' in mhs ? mhs.bagian : 'IT')}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {alt?.nama_perusahaan || 'Mitra PKL'}
                        </p>
                        <p className="text-[11px] text-slate-400">{alt?.kota}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {item.skor_smart ? item.skor_smart.toFixed(4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'disetujui'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.status === 'ditolak'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {item.status === 'disetujui' && <CheckCircle className="w-3 h-3" />}
                          {item.status === 'ditolak' && <XCircle className="w-3 h-3" />}
                          {item.status === 'diajukan' && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.catatan_admin || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAction(item, 'disetujui')}
                            title="Setujui Pengajuan"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAction(item, 'ditolak')}
                            title="Tolak Pengajuan"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={actionType === 'disetujui' ? 'Setujui Pengajuan PKL' : 'Tolak Pengajuan PKL'}
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Anda akan mengubah status pengajuan menjadi{' '}
            <strong className="uppercase font-bold text-slate-900 dark:text-white">
              {actionType}
            </strong>
            .
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Alasan untuk Mahasiswa
            </label>
            <textarea
              rows={3}
              required
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm ${
                actionType === 'disetujui'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Konfirmasi {actionType === 'disetujui' ? 'Persetujuan' : 'Penolakan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
