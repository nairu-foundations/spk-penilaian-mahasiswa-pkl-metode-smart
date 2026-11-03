import type { Kriteria, MahasiswaPKL } from '../types';
import { jalankanSMARTMahasiswa } from './smart';

// Stable across polling; changing source rows, weights, or period invalidates a displayed result.
export function signatureSMART(rows: MahasiswaPKL[], criteria: Kriteria[], periode: string): string {
  return JSON.stringify({ periode, rows: [...rows].filter(row => row.periode === periode).sort((a, b) => a.id.localeCompare(b.id)), criteria: [...criteria].sort((a, b) => a.id.localeCompare(b.id)) });
}

export async function prosesSMART({ imported, replace, periode, kriteria, save, read }: {
  imported: MahasiswaPKL[] | null;
  replace: boolean;
  periode: string;
  kriteria: Kriteria[];
  save: (rows: MahasiswaPKL[], replace: boolean) => Promise<unknown>;
  read: () => Promise<MahasiswaPKL[]>;
}) {
  if (!periode) throw new Error('Pilih periode PKL terlebih dahulu.');
  const active = kriteria.filter(row => row.aktif);
  if (!active.length || active.reduce((sum, row) => sum + row.bobot_awal, 0) <= 0) {
    throw new Error('Tidak ada kriteria aktif dengan bobot yang dapat digunakan untuk perhitungan SMART.');
  }
  const validateScores = (rows: MahasiswaPKL[]) => {
    const invalid = rows.find(row => !active.every(criterion => {
      const value = row.nilai_kriteria?.[criterion.kode];
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
    }));
    if (invalid) throw new Error(`Belum ada nilai lengkap yang valid untuk ${invalid.nama}. Periksa seluruh kriteria aktif.`);
  };
  if (imported) {
    if (!imported.length || imported.some(row => row.periode !== periode)) {
      throw new Error('Data Excel harus berisi mahasiswa untuk periode PKL yang dipilih.');
    }
    validateScores(imported);
    // Validate before any write. Results are only returned after the cloud operation succeeds.
    jalankanSMARTMahasiswa({ mahasiswaList: imported, kriteriaList: kriteria });
    await save(imported, replace);
  }
  const rows = await read();
  const selected = rows.filter(row => row.periode === periode);
  if (!selected.length) throw new Error('Belum ada mahasiswa untuk periode ini. Unggah Excel terlebih dahulu.');
  validateScores(selected);
  const result = jalankanSMARTMahasiswa({ mahasiswaList: selected, kriteriaList: kriteria });
  if (!result.ranking.length) throw new Error('Belum ada nilai lengkap untuk dihitung. Periksa C1, C2, dan C3 mahasiswa.');
  return { rows, result };
}
