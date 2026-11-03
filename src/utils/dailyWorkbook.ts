import * as XLSX from 'xlsx';
import type { MahasiswaPKL, PeriodePKL, RekapBulananPKL } from '../types';
import { nilaiDariRekap } from './penilaianBulanan';

export function isDailyWorkbook(workbook: XLSX.WorkBook): boolean {
  return workbook.SheetNames.some(name => String(workbook.Sheets[name].A1?.v ?? '').startsWith('Data Harian PKL - '));
}

export function mahasiswaDariWorkbookHarian(workbook: XLSX.WorkBook, period: PeriodePKL, basis: RekapBulananPKL['dasar_c2'], source: string): MahasiswaPKL[] {
  const students: MahasiswaPKL[] = [];
  const emails = new Set<string>();
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const title = String(sheet.A1?.v ?? '');
    const identity = title.match(/^Data Harian PKL - (.+?)\s*\(([^\s()]+@[^\s()]+)\)$/);
    if (!identity) continue;
    const email = identity[2].toLowerCase();
    if (emails.has(email)) throw new Error(`Email berulang pada sheet ${name}.`);
    emails.add(email);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
    const daily = rows.filter(row => typeof row[0] === 'number' && typeof row[1] === 'number');
    if (!daily.length) throw new Error(`Sheet ${name} tidak memiliki data harian.`);
    const dates = new Set<string>();
    const boundary = Number(sheet.C3?.v);
    if (!Number.isFinite(boundary) || boundary < 0 || boundary >= 1) throw new Error(`Batas jam masuk pada sheet ${name} tidak valid.`);
    const harian = daily.map(row => {
      const parsed = XLSX.SSF.parse_date_code(Number(row[1]));
      if (!parsed) throw new Error(`Tanggal pada sheet ${name} tidak valid.`);
      const tanggal = `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      if (dates.has(tanggal) || tanggal < period.tanggal_mulai || tanggal > period.tanggal_selesai) throw new Error(`Tanggal ganda atau di luar periode pada sheet ${name}.`);
      dates.add(tanggal);
      const status = String(row[3]).trim().toLowerCase();
      if (!['hadir', 'tidak hadir'].includes(status)) throw new Error(`Status kehadiran pada sheet ${name} tidak dikenali.`);
      const hadir = status === 'hadir';
      const time = row[4] === '' ? null : Number(row[4]);
      if (hadir && (time === null || !Number.isFinite(time) || time < 0 || time >= 1)) throw new Error(`Jam masuk belum valid pada sheet ${name}.`);
      const tepat_waktu = hadir ? Math.round(time! * 86400) <= Math.round(boundary * 86400) : null;
      if (hadir && String(row[5]).trim().toLowerCase() !== (tepat_waktu ? 'tepat waktu' : 'terlambat')) throw new Error(`Status ketepatan waktu tidak sesuai jam masuk pada sheet ${name}.`);
      const target_tugas = row[6] === '' ? 0 : Number(row[6]);
      const tugas_selesai = row[7] === '' ? 0 : Number(row[7]);
      if (![target_tugas, tugas_selesai].every(value => Number.isInteger(value) && value >= 0) || tugas_selesai > target_tugas) throw new Error(`Jumlah tugas pada sheet ${name} tidak valid.`);
      const seconds = time === null ? null : Math.round(time * 86400);
      const jam_masuk = seconds === null ? null : `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}`;
      return { tanggal, hadir, jam_masuk, tepat_waktu, target_tugas, tugas_selesai };
    }).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const rekap: RekapBulananPKL = {
      hari_kerja: harian.length, hari_hadir: harian.filter(row => row.hadir).length,
      hari_tepat_waktu: harian.filter(row => row.tepat_waktu).length,
      target_tugas: harian.reduce((sum, row) => sum + row.target_tugas, 0),
      tugas_selesai: harian.reduce((sum, row) => sum + row.tugas_selesai, 0),
      tanggal_mulai: harian[0].tanggal, tanggal_selesai: harian[harian.length - 1].tanggal,
      dasar_c2: basis, sumber: source, harian,
    };
    students.push({
      id: '', kode_alternatif: `A${students.length + 1}`, nama: identity[1].trim(), email,
      nim: '', institusi: '', bagian: '', no_hp: '', status: 'Aktif',
      periode: period.nama_periode, tanggal_mulai: rekap.tanggal_mulai, tanggal_selesai: rekap.tanggal_selesai,
      rekap_bulanan: rekap, nilai_kriteria: nilaiDariRekap(rekap),
      catatan_evaluasi: `Rekap PKL Oktober 2026: ${rekap.hari_kerja} hari kerja dan ${rekap.target_tugas} tugas bulanan.`,
    });
  }
  if (!students.length) throw new Error('Tidak ada data mahasiswa harian yang dapat dibaca.');
  return students;
}
