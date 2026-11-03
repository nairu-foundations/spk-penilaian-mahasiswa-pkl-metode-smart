import React, { useEffect, useState } from 'react';
import { ArchiveRestore, Download, History, Trash2 } from 'lucide-react';
import type { AuditLog } from '../../types';
import { useQuery } from '../../hooks/useData';
import { auditTrashService, saveAuditFile } from '../../services/auditTrashService';

const date = (value: string) => new Date(value).toLocaleString('id-ID');
export const AuditLogHistory: React.FC<{ logs: AuditLog[]; onChanged: () => Promise<void> }> = ({ logs, onChanged }) => {
  const [page, setPage] = useState(1);
  const { data: trash, loading, error, refetch } = useQuery(() => auditTrashService.list(page), [page]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const pages = Math.max(1, Math.ceil((trash?.total ?? 0) / 20));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const act = async (operation: 'archive' | 'restore' | 'purge', id?: string) => {
    if (busy) return;
    const question = operation === 'purge' ? 'Hapus permanen log ini dari Tempat Sampah? Log tidak dapat dipulihkan lagi.'
      : operation === 'restore' ? 'Pulihkan log ini? Waktu kejadian asli tetap disimpan. Jika sudah ada 20 log aktif, log aktif paling lama akan otomatis masuk Tempat Sampah.'
      : id ? 'Pindahkan log ini ke Tempat Sampah?' : 'Pindahkan seluruh log aktif ke Tempat Sampah? Log dapat dipulihkan kembali.';
    if (!window.confirm(question)) return;
    setBusy(true); setNotice(null);
    try {
      if (operation === 'archive') await auditTrashService.archive(id);
      else if (operation === 'restore') await auditTrashService.restore(id!);
      else await auditTrashService.purge(id!);
      await Promise.all([refetch(), onChanged()]);
      setNotice({ error: false, text: operation === 'purge' ? 'Log telah dihapus permanen.' : operation === 'restore' ? 'Log dipulihkan ke daftar aktif. Kapasitas tetap 20 log.' : 'Log dipindahkan ke Tempat Sampah.' });
    } catch (e) { setNotice({ error: true, text: e instanceof Error ? e.message : 'Tindakan belum berhasil.' }); }
    finally { setBusy(false); }
  };
  const body = (log: AuditLog) => <div className="space-y-1.5"><div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${log.role === 'super_admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{log.role === 'super_admin' ? 'FOUNDER' : log.role === 'admin' ? 'ADMIN HRD' : 'MAHASISWA'}</span><strong>{log.aktor}</strong><span className="font-semibold text-blue-600 dark:text-blue-400">{log.aksi}</span></div><p className="text-xs text-slate-600 dark:text-slate-300 break-words">{log.rincian}</p><p className="text-[11px] text-slate-500">Waktu kejadian: {date(log.waktu)}</p></div>;
  return <div className="space-y-4">
    {(notice || error) && <p role={notice?.error || error ? 'alert' : 'status'} className={`rounded-lg p-3 text-xs ${notice?.error || error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice?.text}</p>}
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold"><History className="w-4 h-4" />Riwayat Audit Aktif ({logs.length}/20)</h3><p className="mt-1 text-xs text-slate-500">Log ke-21 otomatis memindahkan log paling lama ke Tempat Sampah. Data tersimpan di Supabase.</p></div><div className="flex flex-wrap gap-3 text-xs"><button disabled={!logs.length || busy} onClick={() => saveAuditFile(logs)} className="flex gap-1 items-center font-semibold text-blue-600 disabled:opacity-40"><Download className="w-3.5 h-3.5" />Simpan JSON</button><button disabled={!logs.length || busy} onClick={() => act('archive')} className="text-red-600 disabled:opacity-40">Pindahkan Semua ke Sampah</button></div></div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">{logs.map(log => <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between gap-3"><div className="min-w-0 flex-1">{body(log)}</div><button disabled={busy} onClick={() => act('archive', log.id)} className="flex gap-1 items-center self-start text-xs text-red-600 disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" />Hapus</button></div>)}{!logs.length && <p className="p-8 text-center text-sm text-slate-500">Belum ada log aktif.</p>}</div>
    </section>
    <section className="rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800"><h3 className="flex items-center gap-2 text-sm font-bold"><Trash2 className="w-4 h-4 text-amber-600" />Tempat Sampah Audit Log ({trash?.total ?? 0})</h3><p className="text-xs text-slate-500 mt-1">Pulihkan log, simpan salinan JSON, atau hapus permanen. Log yang dipulihkan ditampilkan kembali tanpa mengubah waktu kejadian aslinya.</p></div>
      {loading ? <p className="p-6 text-xs text-slate-500">Memuat riwayat hapus...</p> : <div className="divide-y divide-slate-200 dark:divide-slate-800">{(trash?.items ?? []).map(item => <div key={item.id} className="p-4 space-y-3">{body(item.log)}<div className="flex flex-wrap justify-between gap-3 text-xs"><span className="text-slate-500">Masuk sampah: {date(item.archived_at)} · {item.reason === 'overflow' ? 'Otomatis: kapasitas 20 log' : 'Dihapus manual'}</span><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => act('restore', item.id)} className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold disabled:opacity-40"><ArchiveRestore className="w-3.5 h-3.5" />Pulihkan</button><button onClick={() => saveAuditFile([item.log])} className="text-blue-600 dark:text-blue-400">Simpan JSON</button><button disabled={busy} onClick={() => act('purge', item.id)} className="text-red-600 disabled:opacity-40">Hapus Permanen</button></div></div></div>)}{!trash?.items.length && <p className="p-8 text-center text-sm text-slate-500">Tempat Sampah audit kosong.</p>}</div>}
      <div className="p-4 flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-800"><span>Halaman {Math.min(page, pages)} dari {pages}</span><div className="flex gap-3"><button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><button disabled={busy || page >= pages} onClick={() => setPage(page + 1)}>Selanjutnya</button></div></div>
    </section>
  </div>;
};
