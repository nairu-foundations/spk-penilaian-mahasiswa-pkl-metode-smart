import React, { useState } from 'react';
import type { MahasiswaPKL, RekapBulananPKL } from '../../types';
import { Modal } from '../common/Modal';
import { authService } from '../../services/authService';
import { nilaiDariRekap } from '../../utils/penilaianBulanan';

export const MonthlyAssessmentModal: React.FC<{ student: MahasiswaPKL; onClose: () => void; onSaved: () => Promise<void> }> = ({ student, onClose, onSaved }) => {
  const [recap, setRecap] = useState<RekapBulananPKL>(student.rekap_bulanan!);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  let scores: Record<string, number> | null = null;
  try { scores = nilaiDariRekap(recap); } catch { /* Keep invalid drafts visible until corrected. */ }
  const change = (key: 'hari_hadir' | 'hari_tepat_waktu' | 'tugas_selesai', value: number) => {
    setRecap(current => ({ ...current, [key]: value, harian: undefined, sumber: 'Penyesuaian rekap bulanan oleh admin' }));
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      await authService.saveMahasiswaPKL({ ...student, rekap_bulanan: recap, nilai_kriteria: nilaiDariRekap(recap) });
      await onSaved(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Rekap belum tersimpan.'); }
    finally { setSaving(false); }
  };
  return <Modal isOpen onClose={() => { if (!saving) onClose(); }} title={`Rekap Bulanan — ${student.nama}`} maxWidth="2xl">
    <form onSubmit={save} className="space-y-4">
      <p className="text-xs text-slate-500">{recap.tanggal_mulai} – {recap.tanggal_selesai} · {recap.hari_kerja} hari kerja · 4 tugas</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-3">
        {([
          ['hari_hadir', 'Hari hadir', recap.hari_kerja],
          ['hari_tepat_waktu', 'Hari tepat waktu', recap.hari_hadir],
          ['tugas_selesai', 'Tugas selesai', 4],
        ] as const).map(([key, label, max]) => <label key={key} className="text-xs font-medium space-y-2">
          <span className="block">{label} (maks. {max})</span>
          <input aria-label={label} type="number" min={0} max={max} step={1} required value={recap[key]} disabled={saving} onChange={e => change(key, Number(e.target.value))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" />
        </label>)}
      </div>
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-4 text-xs leading-relaxed">
        <p>C1 = hadir ÷ {recap.hari_kerja} × 100</p><p>C2 = tepat waktu ÷ {recap.dasar_c2 === 'hari_hadir' ? 'hari hadir' : recap.hari_kerja} × 100</p><p>C3 = tugas selesai ÷ 4 × 100</p>
        <p className="font-bold mt-2">{scores ? `C1: ${scores.C1.toFixed(2)} · C2: ${scores.C2.toFixed(2)} · C3: ${scores.C3.toFixed(2)}` : 'Periksa jumlah hari dan tugas.'}</p>
      </div>
      {recap.harian && <details className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <summary className="cursor-pointer font-semibold">Lihat {recap.harian.length} catatan harian dari Excel</summary>
        <div className="overflow-x-auto mt-3"><table className="w-full text-left whitespace-nowrap">
          <thead><tr className="border-b border-slate-200"><th className="p-2">Tanggal</th><th className="p-2">Kehadiran</th><th className="p-2">Jam masuk</th><th className="p-2">Ketepatan</th><th className="p-2">Tugas</th></tr></thead>
          <tbody>{recap.harian.map(day => <tr key={day.tanggal} className="border-b border-slate-100 dark:border-slate-800"><td className="p-2">{day.tanggal}</td><td className="p-2">{day.hadir ? 'Hadir' : 'Tidak hadir'}</td><td className="p-2">{day.jam_masuk ?? '—'}</td><td className="p-2">{day.tepat_waktu === null ? '—' : day.tepat_waktu ? 'Tepat waktu' : 'Terlambat'}</td><td className="p-2">{day.target_tugas ? `${day.tugas_selesai}/${day.target_tugas}` : '—'}</td></tr>)}</tbody>
        </table></div>
      </details>}
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="px-4 py-2 text-xs border border-slate-200 rounded-lg">Batal</button><button disabled={saving || !scores} className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan & Hitung SMART'}</button></div>
    </form>
  </Modal>;
};
