import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Mail,
  Globe,
  Building2,
  Calculator,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { spkService } from '../../services/spkService';
import { Alternatif } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';

export const DaftarTempatPKL: React.FC = () => {
  const navigate = useNavigate();
  const { data: list, loading } = useQuery(() => spkService.getAlternatif());

  const [search, setSearch] = useState('');
  const [filterKota, setFilterKota] = useState('all');
  const [selectedMitra, setSelectedMitra] = useState<Alternatif | null>(null);

  const filtered = (list || []).filter((item) => {
    const matchSearch =
      item.nama_perusahaan.toLowerCase().includes(search.toLowerCase()) ||
      item.bidang.toLowerCase().includes(search.toLowerCase()) ||
      item.alamat.toLowerCase().includes(search.toLowerCase());

    const matchKota = filterKota === 'all' || item.kota === filterKota;
    return matchSearch && matchKota;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Daftar Tempat PKL &amp; Mitra Industri
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Jelajahi seluruh perusahaan dan instansi mitra yang membuka kuota penerimaan magang mahasiswa.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama perusahaan, bidang teknologi, atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative w-full sm:w-56">
          <select
            value={filterKota}
            onChange={(e) => setFilterKota(e.target.value)}
            className="w-full appearance-none pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kota</option>
            <option value="Yogyakarta">Yogyakarta</option>
            <option value="Sleman">Sleman</option>
          </select>
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Grid of Alternatives */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada tempat PKL yang cocok dengan pencarian Anda.
          </p>
          <p className="text-xs text-slate-400 mt-1">Coba atur ulang filter pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    {item.kode}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {item.kota}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {item.nama_perusahaan}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {item.bidang}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.deskripsi}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kuota Terisi:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {item.kuota_terisi || 0} / {item.kuota} Kursi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMitra(item)}
                    className="flex-1 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Detail Mitra
                  </button>
                  <button
                    onClick={() => navigate('/proses-smart')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                    title="Jalankan Rekomendasi SMART"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Hitung</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(selectedMitra)}
        onClose={() => setSelectedMitra(null)}
        title={selectedMitra?.nama_perusahaan || 'Detail Mitra'}
      >
        {selectedMitra && (
          <div className="space-y-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Bidang Spesialisasi
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedMitra.bidang}
              </p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Deskripsi
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {selectedMitra.deskripsi}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Alamat Kantor</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {selectedMitra.alamat}, {selectedMitra.kota}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Kapasitas Kuota</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {selectedMitra.kuota} Mahasiswa
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{selectedMitra.kontak}</span>
              </div>
              {selectedMitra.website && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a
                    href={selectedMitra.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {selectedMitra.website}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMitra(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMitra(null);
                  navigate('/proses-smart');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Mulai Hitung SMART
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
