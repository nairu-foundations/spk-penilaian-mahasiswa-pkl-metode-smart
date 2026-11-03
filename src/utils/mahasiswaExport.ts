import type { MahasiswaPKL } from '../types';

export function mahasiswaCSV(rows: MahasiswaPKL[]): string {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const headers = ['Kode', 'Nama', 'Email', 'Periode', 'Tanggal Mulai', 'Tanggal Selesai', 'Hari Hadir', 'Hari Kerja', 'Hari Tepat Waktu', 'Tugas Selesai', 'Target Tugas', 'C1', 'C2', 'C3', 'Skor SMART', 'Skala 100', 'Peringkat'];
  return '\uFEFF' + [headers, ...rows.map(row => [
    row.kode_alternatif, row.nama, row.email, row.periode, row.tanggal_mulai, row.tanggal_selesai,
    row.rekap_bulanan?.hari_hadir, row.rekap_bulanan?.hari_kerja, row.rekap_bulanan?.hari_tepat_waktu,
    row.rekap_bulanan?.tugas_selesai, row.rekap_bulanan?.target_tugas,
    row.nilai_kriteria?.C1, row.nilai_kriteria?.C2, row.nilai_kriteria?.C3,
    row.skor_akhir_smart, row.nilai_skala_100, row.peringkat,
  ])].map(row => row.map(escape).join(',')).join('\r\n');
}

export function unduhMahasiswa(rows: MahasiswaPKL[], format: 'csv' | 'json') {
  const data = format === 'csv' ? mahasiswaCSV(rows) : JSON.stringify(rows, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `data_mahasiswa_pkl.${format}`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
