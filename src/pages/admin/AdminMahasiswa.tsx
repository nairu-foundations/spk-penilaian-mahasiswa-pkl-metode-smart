import { unduhMahasiswa } from '../../utils/mahasiswaExport';
import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  FileSpreadsheet,
  FileCode,
  Printer,
  Crown,
  ClipboardList,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { MahasiswaPKL } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { usePeriode } from '../../hooks/usePeriode';
import { MonthlyAssessmentModal } from '../../components/admin/MonthlyAssessmentModal';

export const AdminMahasiswa: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { error: mahasiswaError, data: list, loading, refetch } = useQuery(() => authService.getMahasiswaPKLList());
  const [search, setSearch] = useState('');
  const [filterBagian, setFilterBagian] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [recapStudent, setRecapStudent] = useState<MahasiswaPKL | null>(null);
  const { periodeList, periodeAktif, error: periodeError } = usePeriode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MahasiswaPKL | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState('');

  const handleMigrateLocal = async () => {
    if (!window.confirm('Salin data mahasiswa dan nilai dari browser ini ke Supabase? Data dengan email yang sama akan diperbarui.')) return;
    setMigrating(true);
    setMigrationNotice('');
    try {
      const count = await authService.migrateLocalMahasiswa();
      setMigrationNotice(`${count} data mahasiswa berhasil disalin ke Supabase.`);
      await refetch();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal memindahkan data.');
    } finally {
      setMigrating(false);
    }
  };

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formNim, setFormNim] = useState('');
  const [formInstitusi, setFormInstitusi] = useState('');
  const [formBagian, setFormBagian] = useState('IT / Software Engineering');
  const [formPeriode, setFormPeriode] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Selesai' | 'Menunggu Verifikasi'>('Aktif');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNama('');
    setFormNim('');
    setFormInstitusi('');
    setFormBagian('IT / Software Engineering');
    setFormPeriode(periodeAktif?.nama_periode ?? periodeList[0]?.nama_periode ?? '');
    setFormNoHp('');
    setFormEmail('');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mhs: MahasiswaPKL) => {
    setEditingItem(mhs);
    setFormNama(mhs.nama);
    setFormNim(mhs.nim);
    setFormInstitusi(mhs.institusi || '');
    setFormBagian(mhs.bagian || 'IT / Software Engineering');
    setFormPeriode(mhs.periode || periodeAktif?.nama_periode || '');
    setFormNoHp(mhs.no_hp || '');
    setFormEmail(mhs.email || '');
    setFormStatus(mhs.status || 'Aktif');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!formNama.trim() || !formEmail.trim()) return;
      const period = periodeList.find(item => item.nama_periode === formPeriode);
      if (!period) throw new Error('Pilih periode PKL yang tersedia.');

      await authService.saveMahasiswaPKL({
        id: editingItem?.id || `mhs-${Date.now()}`,
        nama: formNama.trim(),
        email: formEmail.trim(),
        nim: formNim.trim(),
        institusi: formInstitusi.trim(),
        bagian: formBagian,
        periode: formPeriode,
        tanggal_mulai: editingItem?.periode === formPeriode ? editingItem.tanggal_mulai : period.tanggal_mulai,
        tanggal_selesai: editingItem?.periode === formPeriode ? editingItem.tanggal_selesai : period.tanggal_selesai,
        no_hp: formNoHp.trim(),
        status: formStatus,
        skor_akhir_smart: editingItem?.skor_akhir_smart,
        peringkat: editingItem?.peringkat,
        keterangan_nilai: editingItem?.keterangan_nilai,
      });

      setIsModalOpen(false);
      await refetch();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    try {
      if (window.confirm(`Hapus data mahasiswa PKL "${nama}" dari sistem?`)) {
        await authService.deleteMahasiswaPKL(id);
        await refetch();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  const handleDownloadCSV = () => unduhMahasiswa(list ?? [], 'csv');
  const handleDownloadJSON = () => unduhMahasiswa(list ?? [], 'json');

  const filteredList = (list || []).filter((m) => {
    const matchSearch =
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.nim || '').toLowerCase().includes(search.toLowerCase()) ||
      m.bagian.toLowerCase().includes(search.toLowerCase()) ||
      (m.institusi && m.institusi.toLowerCase().includes(search.toLowerCase()));

    const matchBagian = filterBagian === 'all' || m.bagian.includes(filterBagian);
    return matchSearch && matchBagian;
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const visibleStudents = filteredList.slice(startIndex, startIndex + pageSize);
  const firstPageNumber = Math.max(1, Math.min(activePage - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPageNumber + index);
  useEffect(() => { setCurrentPage(page => Math.min(page, totalPages)); }, [totalPages]);

  return (
    <div className="space-y-6">
      {mahasiswaError && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{mahasiswaError}</div>}
      {periodeError && <div role="alert" className="text-red-700 text-sm">{periodeError}</div>}
      <div className="p-3 rounded-lg bg-blue-50 text-blue-900 text-sm flex flex-wrap items-center gap-3">
        <span>Data lama hanya ada di browser sebelumnya? Salin sekali agar tersedia di perangkat lain.</span>
        <button type="button" disabled={migrating} onClick={handleMigrateLocal} className="font-semibold underline disabled:opacity-50">
          {migrating ? 'Menyalin...' : 'Salin data browser ke Supabase'}
        </button>
        {migrationNotice && <span role="status">{migrationNotice}</span>}
      </div>
      {/* Header matching Screenshot 3 + Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Mahasiswa PKL
            </h1>
            {isSuperAdmin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Kuasa Founder
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Data Mahasiswa PKL · PT Seven Inc.
          </p>
        </div>

        {/* Action Buttons: Add + Direct Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct File Download Buttons */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            title="Unduh Data dalam format CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors border border-slate-700"
            title="Unduh Data dalam format JSON"
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Unduh JSON</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50"
            title="Cetak Laporan"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mahasiswa</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar matching Screen 3 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIM, universitas, atau divisi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filterBagian}
              onChange={(e) => { setFilterBagian(e.target.value); setCurrentPage(1); }}
              className="appearance-none pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Bagian / Divisi</option>
              <option value="IT">IT &amp; Software Engineering</option>
              <option value="Marketing">Marketing &amp; PR</option>
              <option value="Accounting">Accounting &amp; Finance</option>
              <option value="HRD">HRD &amp; People</option>
              <option value="Creative">Creative &amp; Design</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table matching Screenshot 3 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">Tidak ada data mahasiswa PKL ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Mahasiswa</th>
                  <th className="py-3 px-4">Email Mahasiswa</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Hari Hadir</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tepat Waktu</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tugas Selesai</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4 text-center">Skor SMART</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleStudents.map((mhs, idx) => (
                  <tr
                    key={mhs.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {mhs.nama}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {mhs.email}
                    </td>
                    <td className="py-3 px-4 text-center text-xs tabular-nums">
                      {mhs.rekap_bulanan ? `${mhs.rekap_bulanan.hari_hadir}/${mhs.rekap_bulanan.hari_kerja} hari` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-xs tabular-nums">
                      {mhs.rekap_bulanan ? `${mhs.rekap_bulanan.hari_tepat_waktu}/${mhs.rekap_bulanan.hari_hadir} hadir` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-xs tabular-nums font-semibold">
                      {mhs.rekap_bulanan ? `${mhs.rekap_bulanan.tugas_selesai}/4 tugas` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {mhs.periode || 'Belum dipilih'}
                      <span className="block text-[10px] text-slate-400 whitespace-nowrap">{mhs.tanggal_mulai} – {mhs.tanggal_selesai}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {mhs.skor_akhir_smart ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs tabular-nums">
                              {mhs.skor_akhir_smart.toFixed(4)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Rank #{mhs.peringkat || startIndex + idx + 1}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {mhs.rekap_bulanan && <button type="button" onClick={() => setRecapStudent(mhs)} title="Lihat / Ubah Rekap Bulanan" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"><ClipboardList className="w-4 h-4" /></button>}
                        <button
                          onClick={() => handleOpenEdit(mhs)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                          title="Edit Data Mahasiswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mhs.id, mhs.nama)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="Hapus Data Mahasiswa"
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

        {/* Footer / Pagination matching Screen 3 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span role="status">
            {loading ? 'Memuat data mahasiswa...' : `Menampilkan ${filteredList.length ? startIndex + 1 : 0}–${Math.min(startIndex + pageSize, filteredList.length)} dari ${filteredList.length} data mahasiswa PKL`}
          </span>
          <nav aria-label="Halaman data mahasiswa" className="flex flex-wrap items-center justify-center gap-1">
            <button type="button" aria-label="Halaman sebelumnya" disabled={loading || activePage === 1} onClick={() => setCurrentPage(activePage - 1)} className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
              &lt;
            </button>
            {pageNumbers.map(page => <button key={page} type="button" disabled={loading} aria-label={`Halaman ${page}`} aria-current={page === activePage ? 'page' : undefined} onClick={() => setCurrentPage(page)} className={`px-2.5 py-1 rounded font-medium disabled:opacity-50 ${page === activePage ? 'bg-blue-600 text-white' : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100'}`}>{page}</button>)}
            <button type="button" aria-label="Halaman berikutnya" disabled={loading || activePage === totalPages} onClick={() => setCurrentPage(activePage + 1)} className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
              &gt;
            </button>
            <span className="ml-2">{activePage} / {totalPages}</span>
          </nav>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {recapStudent && <MonthlyAssessmentModal key={recapStudent.id} student={recapStudent} onClose={() => setRecapStudent(null)} onSaved={refetch} />}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Data Mahasiswa PKL' : 'Tambah Mahasiswa PKL Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Nama lengkap mahasiswa"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Mahasiswa *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Institusi / Kampus
              </label>
              <input
                type="text"
                value={formInstitusi}
                onChange={(e) => setFormInstitusi(e.target.value)}
                placeholder="e.g. UGM, UNY, UPN"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bagian / Divisi Penempatan
              </label>
              <select
                value={formBagian}
                onChange={(e) => setFormBagian(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="IT / Software Engineering">IT / Software Engineering</option>
                <option value="IT / Infrastructure">IT / Infrastructure</option>
                <option value="Marketing & PR">Marketing &amp; PR</option>
                <option value="Accounting & Finance">Accounting &amp; Finance</option>
                <option value="HRD & Talent Development">HRD &amp; Talent Development</option>
                <option value="Creative & UI/UX Design">Creative &amp; UI/UX Design</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Periode PKL
              </label>
              <select
                value={formPeriode}
                onChange={(e) => setFormPeriode(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="" disabled>Pilih periode PKL</option>
                {periodeList.map(period => <option key={period.id} value={period.nama_periode}>{period.nama_periode}{period.status === 'Aktif' ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              No. WhatsApp / HP
            </label>
            <input
              type="tel"
              value={formNoHp}
              onChange={(e) => setFormNoHp(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Simpan Data Mahasiswa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
