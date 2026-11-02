import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { pengajuanService } from '../../services/pengajuanService';
import { spkService } from '../../services/spkService';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/common/Skeleton';

export const RiwayatPengajuan: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'mhs-1';

  const { data: pengajuanList, loading: loadingPeng } = useQuery(() =>
    pengajuanService.getPengajuanSaya(userId)
  );
  const { data: riwayatHasil, loading: loadingHasil } = useQuery(() =>
    spkService.getRiwayatHasil(userId)
  );
  const { data: alternatifList } = useQuery(() => spkService.getAlternatif());

  const isLoading = loadingPeng || loadingHasil;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengajuan Saya &amp; Riwayat SMART
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pantau status penerimaan lamaran magang Anda serta catatan hasil perhitungan rekomendasi sebelumnya.
        </p>
      </div>

      {/* Active Application Status */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <span>Status Pengajuan Tempat PKL</span>
        </h2>

        {isLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : !pengajuanList || pengajuanList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Anda belum mengajukan tempat PKL.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan kalkulator SMART untuk meranking tempat PKL paling cocok, lalu kirim pengajuan ke mitra favorit Anda.
            </p>
            <div className="pt-2">
              <Link
                to="/proses-smart"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <span>Mulai Hitung SMART</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pengajuanList.map((p) => {
              const alt =
                p.alternatif ||
                (alternatifList || []).find((a) => a.id === p.alternatif_id);

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'disetujui'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : p.status === 'ditolak'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {p.status === 'disetujui' && <CheckCircle className="w-3.5 h-3.5" />}
                        {p.status === 'ditolak' && <XCircle className="w-3.5 h-3.5" />}
                        {p.status === 'diajukan' && <Clock className="w-3.5 h-3.5" />}
                        <span className="capitalize">{p.status}</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        Diajukan pada{' '}
                        {new Date(p.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {alt?.nama_perusahaan || 'Mitra PKL'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {alt?.bidang} · {alt?.alamat}, {alt?.kota}
                    </p>

                    {p.catatan_admin && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Catatan Admin / Koordinator:
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
                          &ldquo;{p.catatan_admin}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Skor SMART Saat Pengajuan</p>
                    <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                      {p.skor_smart ? p.skor_smart.toFixed(4) : '-'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calculation History */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <span>Riwayat Perhitungan SMART yang Disimpan</span>
        </h2>

        {!riwayatHasil || riwayatHasil.length === 0 ? (
          <p className="text-xs text-slate-500">
            Belum ada riwayat simulasi yang disimpan. Anda dapat menekan &quot;Simpan Hasil Perhitungan&quot; pada halaman Hitung SMART.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riwayatHasil.map((h) => (
              <div
                key={h.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {new Date(h.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-semibold text-blue-600">Tersimpan</span>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Peringkat 1 Teratas:</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {h.ranking[0]?.alternatif?.nama_perusahaan || 'Mitra Rekomendasi'}
                  </p>
                  <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                    Skor: {h.ranking[0]?.skor_akhir.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
