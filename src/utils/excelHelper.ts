import * as XLSX from 'xlsx';
import { MahasiswaPKL } from '../types';
import { SMARTMahasiswaResultItem } from './smart';

export interface ExcelImportRow {
  kode_alternatif?: string;
  nama: string;
  email: string;
  institusi?: string;
  bagian?: string;
  periode?: string;
  c1: number; // Kehadiran (0-100)
  c2: number; // Ketepatan Waktu (0-100)
  c3: number; // Penyelesaian Tugas (0-100)
}

/**
 * Unduh format file Excel (.xlsx) resmi untuk input data penilaian mahasiswa SMART
 */
export function unduhTemplateExcelSMART(): void {
  const headers = [
    'Kode Alternatif',
    'Nama Mahasiswa',
    'Email Mahasiswa',
    'Institusi / Kampus',
    'Bagian / Divisi Penempatan',
    'Kehadiran C1 (Bobot 30%)',
    'Ketepatan Waktu C2 (Bobot 20%)',
    'Penyelesaian Tugas C3 (Bobot 50%)',
  ];

  const sampleData = [
    [
      'A1',
      'Andi Pratama',
      'andi.pratama@mail.ugm.ac.id',
      'Universitas Gadjah Mada',
      'IT / Software Engineering',
      95,
      90,
      92,
    ],
    [
      'A2',
      'Rina Anggraini',
      'rina.anggraini@student.uny.ac.id',
      'Universitas Negeri Yogyakarta',
      'HRD & Talent Development',
      95,
      90,
      85,
    ],
    [
      'A3',
      'Siti Nurhaliza',
      'siti.nurhaliza@upnyk.ac.id',
      'Universitas Pembangunan Nasional',
      'Marketing & PR',
      90,
      95,
      85,
    ],
    [
      'A4',
      'Budi Santoso',
      'budi.santoso@students.uii.ac.id',
      'Universitas Islam Indonesia',
      'Accounting & Finance',
      80,
      85,
      75,
    ],
    [
      'A5',
      'Dika Pratama',
      'dika.pratama@ity.ac.id',
      'Institut Teknologi Yogyakarta',
      'IT / Infrastructure',
      75,
      80,
      70,
    ],
    [
      'A6',
      'Maya Safitri',
      'maya.safitri@mail.ugm.ac.id',
      'Universitas Gadjah Mada',
      'UI/UX & Creative Media',
      88,
      92,
      86,
    ],
    [
      'A7',
      'Fajar Nugroho',
      'fajar.nugroho@student.uny.ac.id',
      'Universitas Negeri Yogyakarta',
      'Digital Marketing',
      82,
      88,
      90,
    ],
  ];

  // Petunjuk pengisian sheet terpisah
  const petunjukData = [
    ['PANDUAN INPUT DATA MAHASISWA PKL METODE SMART - PT SEVEN INC.'],
    [''],
    ['1. Kolom Nama Mahasiswa dan Email Mahasiswa wajib diisi dengan format valid.'],
    ['2. Email Mahasiswa berfungsi sebagai identitas kunci unik setiap mahasiswa.'],
    ['3. Nilai kriteria diisi dengan angka pada rentang skala 0 s.d. 100.'],
    ['4. Kriteria C1 (Kehadiran): Bobot 30% (Semakin tinggi kehadiran, nilai mendekati 100).'],
    ['5. Kriteria C2 (Ketepatan Waktu): Bobot 20% (Kedisiplinan jam masuk kerja PT Seven Inc.).'],
    ['6. Kriteria C3 (Penyelesaian Tugas): Bobot 50% (Performa dan mutu penuntasan proyek kerja).'],
    ['7. File yang disimpan dapat langsung diunggah ke tampilan Perhitungan SMART untuk diotomatisasi.'],
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Mahasiswa
  const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  wsData['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 32 },
    { wch: 32 },
    { wch: 28 },
    { wch: 24 },
    { wch: 28 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Data Mahasiswa PKL');

  // Sheet 2: Petunjuk
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  wsPetunjuk['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Kriteria');

  XLSX.writeFile(wb, 'Format_Penilaian_SMART_Mahasiswa_PKL_SevenInc.xlsx');
}

/**
 * Parsing file Excel / CSV menjadi array data mahasiswa terstruktur
 */
export async function bacaFileExcelMahasiswa(file: File): Promise<MahasiswaPKL[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Ambil sheet pertama
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('Lembar kerja (sheet) pada file Excel tidak ditemukan.');
  }

  // Convert to JSON with header rows
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('File Excel tidak berisi data mahasiswa (tabel kosong).');
  }

  const result: MahasiswaPKL[] = [];

  rawRows.forEach((row, idx) => {
    // Normalisasi kunci header
    const keys = Object.keys(row);

    const findVal = (patterns: string[]): unknown => {
      for (const k of keys) {
        const lowerKey = k.toLowerCase().trim();
        for (const p of patterns) {
          if (lowerKey.includes(p)) return row[k];
        }
      }
      return undefined;
    };

    const nama = String(findVal(['nama', 'name']) || `Mahasiswa ${idx + 1}`).trim();
    let email = String(findVal(['email', 'surel', 'mail']) || '').trim().toLowerCase();

    // Fallback email jika kosong
    if (!email || !email.includes('@')) {
      const cleanNama = nama.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${cleanNama}.${idx + 1}@mhs.seveninc.co.id`;
    }

    const kodeAlt = String(findVal(['kode', 'alternatif', 'alt']) || `A${idx + 1}`).trim();
    const institusi = String(findVal(['institusi', 'kampus', 'universitas', 'asal']) || 'PT Seven Inc.').trim();
    const bagian = String(findVal(['bagian', 'divisi', 'penempatan', 'departemen']) || 'IT / Software Engineering').trim();
    const periode = String(findVal(['periode']) || 'Periode 1 - 2025').trim();
    const noHp = String(findVal(['no_hp', 'hp', 'telepon', 'wa', 'whatsapp']) || '0812-3456-7890').trim();

    // Nilai Kriteria C1, C2, C3
    const parseNumber = (val: unknown, fallback: number): number => {
      const num = Number(val);
      if (isNaN(num)) return fallback;
      return Math.max(0, Math.min(100, num));
    };

    const c1Val = parseNumber(findVal(['c1', 'kehadiran', 'presensi']), 85);
    const c2Val = parseNumber(findVal(['c2', 'ketepatan', 'waktu']), 85);
    const c3Val = parseNumber(findVal(['c3', 'tugas', 'penyelesaian']), 85);

    // Hitung estimasi utilitas dan skor awal
    const u1 = Number((c1Val / 100).toFixed(4));
    const u2 = Number((c2Val / 100).toFixed(4));
    const u3 = Number((c3Val / 100).toFixed(4));
    const skorAkhir = Number((0.30 * u1 + 0.20 * u2 + 0.50 * u3).toFixed(4));
    const skala100 = Number((skorAkhir * 100).toFixed(2));

    let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' = 'Kurang';
    if (skala100 >= 90) predikat = 'Sangat Baik';
    else if (skala100 >= 80) predikat = 'Baik';
    else if (skala100 >= 70) predikat = 'Cukup';

    result.push({
      id: `mhs-excel-${Date.now()}-${idx}`,
      kode_alternatif: kodeAlt,
      nama,
      email,
      nim: `2024100${idx + 1}`,
      institusi,
      bagian,
      periode,
      tanggal_mulai: '2025-01-01',
      tanggal_selesai: '2025-06-30',
      no_hp: noHp,
      status: 'Aktif',
      nilai_kriteria: {
        C1: c1Val,
        C2: c2Val,
        C3: c3Val,
      },
      utility: {
        C1: u1,
        C2: u2,
        C3: u3,
      },
      skor_akhir_smart: skorAkhir,
      nilai_skala_100: skala100,
      peringkat: idx + 1,
      keterangan_nilai: predikat,
    });
  });

  return result;
}

/**
 * Ekspor Hasil Perhitungan SMART Lengkap ke File Excel (.xlsx) Multi-Sheet
 */
export function eksporHasilSMARTKeExcel(
  ranking: SMARTMahasiswaResultItem[],
  namaPeriode = 'Periode 1 - 2025'
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ranking & Hasil Akhir
  const rankingHeaders = [
    'Peringkat',
    'Kode Alternatif',
    'Nama Mahasiswa',
    'Email Mahasiswa',
    'Institusi / Kampus',
    'Bagian / Divisi',
    'Nilai Kehadiran (C1)',
    'Nilai Ketepatan Waktu (C2)',
    'Nilai Tugas (C3)',
    'Kontribusi w1*u1 (30%)',
    'Kontribusi w2*u2 (20%)',
    'Kontribusi w3*u3 (50%)',
    'Nilai Akhir SMART (Vi)',
    'Nilai Skala 100',
    'Predikat Kinerja',
  ];

  const rankingRows = ranking.map((r) => [
    r.peringkat,
    r.kode_alternatif,
    r.nama,
    r.email,
    r.institusi || 'PT Seven Inc.',
    r.bagian,
    r.nilai_mentah.C1,
    r.nilai_mentah.C2,
    r.nilai_mentah.C3,
    r.kontribusi.C1.toFixed(4),
    r.kontribusi.C2.toFixed(4),
    r.kontribusi.C3.toFixed(4),
    r.skor_akhir.toFixed(4),
    r.nilai_skala_100.toFixed(2),
    r.keterangan,
  ]);

  const wsRanking = XLSX.utils.aoa_to_sheet([rankingHeaders, ...rankingRows]);
  wsRanking['!cols'] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 25 },
    { wch: 32 },
    { wch: 30 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRanking, 'Hasil & Peringkat SMART');

  // 2. Sheet Matriks Utilitas (u_ij)
  const utilitasHeaders = [
    'Kode',
    'Nama Mahasiswa',
    'Email',
    'Utilitas C1 (u1)',
    'Utilitas C2 (u2)',
    'Utilitas C3 (u3)',
    'Total Vi',
  ];

  const utilitasRows = ranking.map((r) => [
    r.kode_alternatif,
    r.nama,
    r.email,
    r.utilitas.C1.toFixed(4),
    r.utilitas.C2.toFixed(4),
    r.utilitas.C3.toFixed(4),
    r.skor_akhir.toFixed(4),
  ]);

  const wsUtilitas = XLSX.utils.aoa_to_sheet([utilitasHeaders, ...utilitasRows]);
  wsUtilitas['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUtilitas, 'Matriks Utilitas u_ij');

  const cleanFilename = `Hasil_SMART_Mahasiswa_PKL_${namaPeriode.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
