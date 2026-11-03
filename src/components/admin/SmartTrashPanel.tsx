import React, { useState } from 'react';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { smartTrashService, SmartTrashItem } from '../../services/smartTrashService';

export const SmartTrashPanel: React.FC<{ disabled: boolean; onChanged: () => Promise<void>; onBusy: (busy: boolean) => void }> = ({ disabled, onChanged, onBusy }) => {
  const { data, error, loading, refetch } = useQuery(() => smartTrashService.list());
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const pages = Math.max(1, Math.ceil((data?.length ?? 0) / 5));
  const current = Math.min(page, pages);
  const action = async (item: SmartTrashItem, operation: 'restore' | 'history' | 'purge') => {
    if (disabled || busy) return;
    const prompt = operation === 'purge'
      ? `Hapus permanen "${item.label}" dari Tempat Sampah? Data ini tidak dapat dipulihkan lagi.`
      : operation === 'history' ? 'Pulihkan arsip perhitungan saja? Data mahasiswa aktif tetap dipertahankan.'
      : `Pulihkan "${item.label}" beserta data yang disimpan? Dataset aktif tidak akan ditimpa.`;
    if (!window.confirm(prompt)) return;
    setBusy(true); onBusy(true); setMessage(null);
    try {
      if (operation === 'purge') {
        await smartTrashService.purge(item.id);
        setMessage({ error: false, text: 'Data telah dihapus permanen dari Tempat Sampah.' });
      } else {
        const restored = await smartTrashService.restore(item.id, operation === 'history');
        setMessage({ error: false, text: `${restored.students} mahasiswa dan ${restored.history} riwayat berhasil dipulihkan. ${operation === 'history' && item.student_count ? 'Salinan mahasiswa tetap tersedia di Tempat Sampah.' : ''}` });
      }
      await refetch(); await onChanged();
    } catch (e) { setMessage({ error: true, text: e instanceof Error ? e.message : 'Tindakan belum berhasil.' }); }
    finally { setBusy(false); onBusy(false); }
  };
  return <details className="rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 p-4">
    <summary className="cursor-pointer text-sm font-bold flex items-center gap-2"><Trash2 className="w-4 h-4 text-amber-600" />Tempat Sampah / Riwayat Hapus ({data?.length ?? 0})</summary>
    <div className="mt-4 space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed">Data yang dihapus disimpan di Supabase sampai dipulihkan atau dihapus permanen. Pemulihan penuh satu dataset memerlukan data mahasiswa aktif kosong. Untuk melihat hasil lama tanpa mengubah dataset baru, pilih Pulihkan Riwayat Saja.</p>
      {(error || message) && <p role={error || message?.error ? 'alert' : 'status'} className={`text-xs rounded-lg p-3 ${error || message?.error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{error || message?.text}</p>}
      {loading ? <p className="text-xs py-5 text-slate-500">Memuat Tempat Sampah...</p> : !data?.length ? <p className="text-xs py-5 text-center text-slate-500">Tempat Sampah kosong.</p> : <>
        <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="bg-slate-50 dark:bg-slate-800"><th className="p-3">Data / Waktu Hapus</th><th className="p-3">Isi Arsip</th><th className="p-3">Tindakan</th></tr></thead><tbody>{data.slice((current - 1) * 5, current * 5).map(item => <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
          <td className="p-3"><strong>{item.label}</strong><p className="mt-1 text-slate-500 whitespace-nowrap">{new Date(item.deleted_at).toLocaleString('id-ID')}</p></td>
          <td className="p-3 whitespace-nowrap">{item.student_count} mahasiswa<br />{item.history_count} riwayat</td>
          <td className="p-3"><div className="flex flex-wrap gap-2"><button disabled={busy || disabled} onClick={() => action(item, 'restore')} className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold disabled:opacity-40"><ArchiveRestore className="w-3.5 h-3.5" />Pulihkan{item.student_count ? ' Seluruh Data' : ''}</button>
            {!!item.student_count && !!item.history_count && <button disabled={busy || disabled} onClick={() => action(item, 'history')} className="text-blue-600 dark:text-blue-400 disabled:opacity-40">Pulihkan Riwayat Saja</button>}
            <button disabled={busy || disabled} onClick={() => action(item, 'purge')} className="text-red-600 disabled:opacity-40">Hapus Permanen</button></div></td>
        </tr>)}</tbody></table></div>
        <div className="flex justify-between text-xs"><span>Halaman {current} dari {pages}</span><div className="flex gap-3"><button disabled={busy || current <= 1} onClick={() => setPage(current - 1)}>Sebelumnya</button><button disabled={busy || current >= pages} onClick={() => setPage(current + 1)}>Selanjutnya</button></div></div>
      </>}
    </div>
  </details>;
};
