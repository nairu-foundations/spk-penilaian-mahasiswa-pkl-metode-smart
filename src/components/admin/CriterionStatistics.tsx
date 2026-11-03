import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, ChevronDown } from 'lucide-react';
import type { Kriteria, MahasiswaPKL, PeriodePKL } from '../../types';
import { statistikKriteria } from '../../utils/criterionStatistics';

const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed'];
const fmt = (value: number | null) => value === null ? '—' : value.toLocaleString('id-ID', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const tooltipStyle = { borderRadius: 12, border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', fontSize: 12 };

export const CriterionStatistics: React.FC<{ students: MahasiswaPKL[]; criteria: Kriteria[]; periods: PeriodePKL[] }> = ({ students, criteria, periods }) => {
  const [period, setPeriod] = useState<string | null>(null);
  const [criterion, setCriterion] = useState('');
  const [mode, setMode] = useState<'comparison' | 'distribution' | 'students'>('comparison');
  const selectedPeriod = period ?? periods.find(row => row.status === 'Aktif')?.nama_periode ?? '';
  const periodNames = [...new Set([...periods.map(row => row.nama_periode), ...students.map(row => row.periode)])].filter(Boolean);
  const filtered = selectedPeriod ? students.filter(row => row.periode === selectedPeriod) : students;
  const stats = criteria.filter(row => row.aktif).sort((a, b) => a.urutan - b.urutan).map((row, i) => ({ ...row, color: colors[i % colors.length], ...statistikKriteria(filtered, row.kode) }));
  const selected = stats.find(row => row.kode === criterion) ?? stats[0];
  const comparison = stats.map(row => ({ name: row.kode, mean: row.mean, median: row.median }));

  return <section aria-label="Statistik nilai kriteria SMART" className="lg:col-span-2 min-w-0 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3"><div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600 h-fit"><BarChart3 className="w-5 h-5" /></div><div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Statistik Nilai Kriteria SMART</h3>
        <p className="text-xs text-slate-500 mt-1">{filtered.length} mahasiswa · Skala 0–100 · Data terbaru dari Supabase</p>
      </div></div>
      <label className="text-xs text-slate-500 space-y-1"><span className="block">Periode statistik</span><select aria-label="Periode statistik" value={selectedPeriod} onChange={event => setPeriod(event.target.value)} className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1.5"><option value="">Semua periode</option>{periodNames.map(name => <option key={name}>{name}</option>)}</select></label>
    </div>

    {!stats.length ? <p className="py-12 text-center text-sm text-slate-500">Belum ada kriteria SMART aktif.</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(row => <button key={row.kode} type="button" aria-pressed={selected?.kode === row.kode} onClick={() => { setCriterion(row.kode); setMode('distribution'); }} className={`text-left p-3 rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${selected?.kode === row.kode ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex gap-1.5 items-center"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />{row.kode} · {row.nama}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{fmt(row.mean)}<span className="text-[10px] font-normal ml-1 text-slate-500">rata-rata</span></p>
          <div className="text-[11px] text-slate-500 mt-2 space-y-1"><p>Median <strong className="text-slate-700 dark:text-slate-300">{fmt(row.median)}</strong></p><p>Min {fmt(row.min)} · Maks {fmt(row.max)}</p><p>{row.count} nilai valid · {row.missing} belum valid</p></div>
        </button>)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1" role="group" aria-label="Tampilan grafik statistik">
          {([['comparison', 'Perbandingan'], ['distribution', 'Sebaran Nilai'], ['students', 'Per Mahasiswa']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${mode === value ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-500 hover:text-blue-600'}`}>{label}</button>)}
        </div>
        {mode !== 'comparison' && <select aria-label="Kriteria statistik" value={selected.kode} onChange={event => setCriterion(event.target.value)} className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 max-w-full">{stats.map(row => <option key={row.kode} value={row.kode}>{row.kode} - {row.nama}</option>)}</select>}
      </div>

      {filtered.length === 0 || stats.every(row => row.count === 0) ? <p className="h-64 flex items-center justify-center text-sm text-slate-500">Belum ada nilai valid pada periode ini.</p> : <>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{mode === 'comparison' ? 'Rata-rata dan median setiap kriteria' : mode === 'distribution' ? `Sebaran ${selected.kode}: jumlah mahasiswa per rentang nilai` : `Nilai ${selected.kode} setiap mahasiswa, diurutkan dari tertinggi`}</p>
        {mode !== 'comparison' && !selected.count ? <p className="h-64 flex items-center justify-center text-sm text-slate-500">Belum ada nilai valid untuk {selected.kode}.</p> : <div className={`${mode === 'students' ? 'max-h-80 overflow-y-auto' : ''}`}>
          <div role="img" aria-label={mode === 'comparison' ? 'Grafik perbandingan rata-rata dan median. Rincian tersedia pada kartu statistik.' : `Grafik ${selected.kode}. Rincian tersedia pada tabel data statistik.`} style={{ height: mode === 'students' ? Math.max(260, selected.count * 42) : 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'comparison' ? <BarChart data={comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [fmt(Number(value)), name]} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="mean" name="Rata-rata" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={44} isAnimationActive={false} /><Bar dataKey="median" name="Median" fill="#38bdf8" radius={[5, 5, 0, 0]} maxBarSize={44} isAnimationActive={false} />
              </BarChart> : mode === 'distribution' ? <BarChart data={selected.bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value, _name, item) => [`${value} mahasiswa (${fmt(item.payload.percent)}%)`, 'Jumlah']} /><Bar dataKey="count" name="Mahasiswa" fill={selected.color} radius={[5, 5, 0, 0]} maxBarSize={60} isAnimationActive={false} />
              </BarChart> : <BarChart data={selected.entries} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.5} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 10 }} tickFormatter={name => name.length > 18 ? `${name.slice(0, 17)}…` : name} /><Tooltip contentStyle={tooltipStyle} formatter={value => [fmt(Number(value)), selected.nama]} /><Bar dataKey="value" fill={selected.color} radius={[0, 5, 5, 0]} maxBarSize={20} isAnimationActive={false}>{selected.entries.map(entry => <Cell key={entry.id} fill={entry.value >= (selected.mean ?? 0) ? selected.color : '#94a3b8'} />)}</Bar>
              </BarChart>}
            </ResponsiveContainer>
          </div>
        </div>}
      </>}

      {selected && <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-3">
        <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-semibold">{selected.kode} · {selected.nama}</span><span className="text-slate-500">Simpangan baku <strong className="text-slate-700 dark:text-slate-200 tabular-nums">{fmt(selected.deviation)}</strong></span></div>
        <p className="text-[11px] text-slate-500 leading-relaxed">Simpangan baku populasi menunjukkan keragaman nilai; semakin kecil, semakin seragam. Nilai kosong, nonangka, atau di luar 0–100 tidak dihitung. Nilai 0 tetap dihitung. Grafik ini merangkum data saat ini, bukan tren waktu.</p>
        <details className="text-xs"><summary className="cursor-pointer font-semibold flex items-center gap-1.5"><ChevronDown className="w-3.5 h-3.5" />Lihat tabel data statistik</summary>
          <div className="overflow-x-auto max-h-64 mt-3"><table className="w-full text-left text-xs"><caption className="sr-only">Rincian nilai {selected.kode}</caption><thead><tr><th className="p-2">Mahasiswa</th><th className="p-2 text-right">Nilai</th><th className="p-2 text-right">Selisih dari rata-rata</th></tr></thead><tbody>{selected.entries.map(entry => <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-700"><td className="p-2">{entry.name}</td><td className="p-2 text-right tabular-nums">{fmt(entry.value)}</td><td className="p-2 text-right tabular-nums">{entry.value >= selected.mean! ? '+' : ''}{fmt(entry.value - selected.mean!)}</td></tr>)}</tbody></table>{!selected.count && <p className="p-2 text-slate-500">Belum ada nilai valid.</p>}</div>
        </details>
      </div>}
    </>}
  </section>;
};
