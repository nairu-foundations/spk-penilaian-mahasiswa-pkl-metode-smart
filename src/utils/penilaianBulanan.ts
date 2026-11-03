import type { RekapBulananPKL } from '../types';

export function nilaiDariRekap(rekap: RekapBulananPKL): Record<string, number> {
  const { hari_kerja, hari_hadir, hari_tepat_waktu, target_tugas, tugas_selesai } = rekap;
  if (![hari_kerja, hari_hadir, hari_tepat_waktu, target_tugas, tugas_selesai].every(value => Number.isInteger(value) && value >= 0)
    || hari_kerja === 0 || target_tugas !== 4 || hari_hadir > hari_kerja || hari_tepat_waktu > hari_hadir || tugas_selesai > target_tugas) {
    throw new Error('Rekap bulanan tidak valid. Periksa jumlah hadir, tepat waktu, serta tugas selesai dari 4 tugas.');
  }
  if (!['hari_kerja', 'hari_hadir'].includes(rekap.dasar_c2)) throw new Error('Dasar perhitungan C2 belum dipilih.');
  const percent = (value: number, total: number) => total ? Number((value / total * 100).toFixed(4)) : 0;
  return {
    C1: percent(hari_hadir, hari_kerja),
    C2: percent(hari_tepat_waktu, rekap.dasar_c2 === 'hari_hadir' ? hari_hadir : hari_kerja),
    C3: percent(tugas_selesai, target_tugas),
  };
}
