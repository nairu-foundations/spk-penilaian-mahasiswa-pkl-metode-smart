import { test } from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import { build } from 'esbuild';

globalThis.monthlyTestXLSX = XLSX;
const compiled = await build({ stdin: { contents: `export {mahasiswaDariWorkbookHarian} from './src/utils/dailyWorkbook'; export {nilaiDariRekap} from './src/utils/penilaianBulanan'; export {jalankanSMARTMahasiswa} from './src/utils/smart';`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', plugins: [{ name: 'spreadsheet-runtime', setup(builder) {
  builder.onResolve({ filter: /^xlsx$/ }, () => ({ path: 'xlsx', namespace: 'test' }));
  builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const utils = globalThis.monthlyTestXLSX.utils; export const SSF = globalThis.monthlyTestXLSX.SSF;' }));
} }] });
const { mahasiswaDariWorkbookHarian, nilaiDariRekap, jalankanSMARTMahasiswa } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const period = { nama_periode: 'Periode 1 - 2026', tanggal_mulai: '2026-10-01', tanggal_selesai: '2026-10-31' };
const criteria = [30, 20, 50].map((bobot_awal, index) => ({ id: `k${index}`, kode: `C${index + 1}`, aktif: true, tipe: 'benefit', bobot_awal, urutan: index }));

function sheet(index, absent, late, completed) {
  const rows = [[`Data Harian PKL - Mahasiswa ${index} (mahasiswa${index}@example.test)`], [], ['', '', 8 / 24], [], ['No', 'Tanggal', 'Hari', 'Status Kehadiran', 'Jam Masuk', 'Status Ketepatan Waktu', 'Target Tugas', 'Tugas Selesai']];
  for (let day = 0; day < 20; day++) {
    const hadir = !absent.includes(day);
    const terlambat = late.includes(day);
    rows.push([day + 1, 46300 + day + 2 * Math.floor(day / 5), '', hadir ? 'Hadir' : 'Tidak Hadir', hadir ? (terlambat ? 8.25 : 7.75) / 24 : '', hadir ? terlambat ? 'Terlambat' : 'Tepat Waktu' : '-', day % 5 === 0 ? 1 : '', day % 5 === 0 ? Number(day / 5 < completed) : '']);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}
function book(sheets) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((value, index) => XLSX.utils.book_append_sheet(workbook, value, `Data ${index}`));
  return workbook;
}

test('all five daily sheets become exactly five students with attendance-based C2 and four tasks', () => {
  const workbook = book([
    sheet(1, [4, 9], [15, 19], 4), sheet(2, [18], [6, 17], 4),
    sheet(3, [4, 11], [6], 4), sheet(4, [2, 3, 6, 14], [8, 10, 16], 3),
    sheet(5, [0, 6, 7, 10, 12], [1, 3, 16, 19], 2),
  ]);
  const students = mahasiswaDariWorkbookHarian(workbook, period, 'hari_hadir', 'test.xlsx');
  assert.equal(students.length, 5);
  assert.deepEqual(students.map(row => row.rekap_bulanan.hari_hadir), [18, 19, 18, 16, 15]);
  assert.deepEqual(students.map(row => row.rekap_bulanan.hari_tepat_waktu), [16, 17, 17, 13, 11]);
  assert.deepEqual(students.map(row => row.nilai_kriteria.C3), [100, 100, 100, 75, 50]);
  assert.equal(students[0].nilai_kriteria.C2, 88.8889);
  assert.equal(students[0].tanggal_mulai, '2026-10-05');
  assert.equal(students[0].tanggal_selesai, '2026-10-30');
  assert.equal(students[4].rekap_bulanan.harian[0].tugas_selesai, 1);
  assert.equal(students[4].rekap_bulanan.harian[0].hadir, false);
  assert.equal(students[0].nim, ''); assert.equal(students[0].institusi, '');
  const result = jalankanSMARTMahasiswa({ mahasiswaList: students, kriteriaList: criteria });
  assert.deepEqual(result.ranking.map(row => row.nama), ['Mahasiswa 2', 'Mahasiswa 3', 'Mahasiswa 1', 'Mahasiswa 4', 'Mahasiswa 5']);
  assert.deepEqual(result.ranking.map(row => row.skor_akhir), [.9639, .9589, .9478, .7775, .6217]);
});

test('four-task completion changes C3 by 25 points per task and rejects impossible counts', () => {
  const recap = { hari_kerja: 20, hari_hadir: 18, hari_tepat_waktu: 16, target_tugas: 4, tugas_selesai: 3, dasar_c2: 'hari_hadir' };
  assert.equal(nilaiDariRekap(recap).C3, 75);
  assert.throws(() => nilaiDariRekap({ ...recap, tugas_selesai: 5 }));
  assert.throws(() => nilaiDariRekap({ ...recap, hari_tepat_waktu: 19 }));
  assert.throws(() => nilaiDariRekap({ ...recap, hari_hadir: 18.5 }));
  assert.equal(nilaiDariRekap({ ...recap, hari_hadir: 0, hari_tepat_waktu: 0 }).C2, 0);
});

test('arrival exactly at 08:00 is on time, later arrivals are late', () => {
  const value = sheet(1, [], [], 4); value.E6.v = 8 / 24;
  assert.equal(mahasiswaDariWorkbookHarian(book([value]), period, 'hari_hadir', 'test.xlsx')[0].rekap_bulanan.hari_tepat_waktu, 20);
  value.E6.v = (8 * 3600 + 60) / 86400;
  assert.throws(() => mahasiswaDariWorkbookHarian(book([value]), period, 'hari_hadir', 'test.xlsx'), /tidak sesuai/);
});

test('invalid or duplicate dates and a target other than four reject the import', () => {
  const duplicate = sheet(1, [], [], 4); duplicate.B7.v = duplicate.B6.v;
  assert.throws(() => mahasiswaDariWorkbookHarian(book([duplicate]), period, 'hari_hadir', 'test.xlsx'), /Tanggal ganda/);
  const wrongTarget = sheet(1, [], [], 4); wrongTarget.G6.v = 2;
  assert.throws(() => mahasiswaDariWorkbookHarian(book([wrongTarget]), period, 'hari_hadir', 'test.xlsx'), /4 tugas/);
  const missingTime = sheet(1, [], [], 4); missingTime.E6.v = '';
  assert.throws(() => mahasiswaDariWorkbookHarian(book([missingTime]), period, 'hari_hadir', 'test.xlsx'), /Jam masuk/);
});
