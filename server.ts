import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface Types for Backend
interface MahasiswaRecord {
  id: string;
  kode_alternatif: string;
  nama: string;
  email: string;
  nim?: string;
  institusi: string;
  bagian: string;
  periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  no_hp: string;
  status: 'Aktif' | 'Selesai' | 'Menunggu Verifikasi';
  nilai_kriteria: {
    C1: number; // Kehadiran (0-100)
    C2: number; // Ketepatan Waktu (0-100)
    C3: number; // Penyelesaian Tugas (0-100)
  };
  utility?: {
    C1: number;
    C2: number;
    C3: number;
  };
  skor_akhir_smart?: number;
  nilai_skala_100?: number;
  peringkat?: number;
  keterangan_nilai?: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
}

interface KriteriaRecord {
  id: string;
  kode: string;
  nama: string;
  tipe: 'benefit' | 'cost';
  bobot_awal: number;
  bobot_normal: number;
  deskripsi: string;
  urutan: number;
  aktif: boolean;
}

interface AuditLogRecord {
  id: string;
  aktor: string;
  role: 'super_admin' | 'admin' | 'mahasiswa';
  aksi: string;
  rincian: string;
  waktu: string;
}

interface SKJuaraRecord {
  nomor_sk: string;
  periode: string;
  pemenang: {
    nama: string;
    email: string;
    bagian: string;
    skor_akhir_smart: number;
    nilai_skala_100: number;
    predikat: string;
  };
  disahkan_oleh: string;
  status: string;
  tanggal_pengesahan: string;
}

// Initial Data Sets
const INITIAL_KRITERIA: KriteriaRecord[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    kode: 'C1',
    nama: 'Kehadiran',
    tipe: 'benefit',
    bobot_awal: 30,
    bobot_normal: 0.30,
    deskripsi: 'Tingkat presensi dan kedisiplinan partisipasi kerja selama periode PKL di PT Seven Inc. (Skala 0-100)',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    kode: 'C2',
    nama: 'Ketepatan Waktu',
    tipe: 'benefit',
    bobot_awal: 20,
    bobot_normal: 0.20,
    deskripsi: 'Kepatuhan mahasiswa terhadap jam masuk kerja dan tata tertib operasional kantor (Skala 0-100)',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    kode: 'C3',
    nama: 'Penyelesaian Tugas',
    tipe: 'benefit',
    bobot_awal: 50,
    bobot_normal: 0.50,
    deskripsi: 'Kemampuan, kualitas hasil, dan kecepatan dalam menuntaskan proyek tugas kerja magang (Skala 0-100)',
    urutan: 3,
    aktif: true,
  },
];

const INITIAL_MAHASISWA: MahasiswaRecord[] = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    kode_alternatif: 'A1',
    nama: 'Andi Pratama',
    email: 'andi.pratama@mail.ugm.ac.id',
    nim: '20241001',
    institusi: 'Universitas Gadjah Mada',
    bagian: 'IT / Software Engineering',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '0812-3456-7801',
    status: 'Aktif',
    nilai_kriteria: { C1: 95, C2: 90, C3: 92 },
    utility: { C1: 0.95, C2: 0.90, C3: 0.92 },
    skor_akhir_smart: 0.9250,
    nilai_skala_100: 92.50,
    peringkat: 1,
    keterangan_nilai: 'Sangat Baik',
  },
  {
    id: 'm2222222-2222-2222-2222-222222222222',
    kode_alternatif: 'A2',
    nama: 'Rina Anggraini',
    email: 'rina.anggraini@student.uny.ac.id',
    nim: '20241004',
    institusi: 'Universitas Negeri Yogyakarta',
    bagian: 'HRD & Talent Development',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '0812-3456-7802',
    status: 'Aktif',
    nilai_kriteria: { C1: 95, C2: 90, C3: 85 },
    utility: { C1: 0.95, C2: 0.90, C3: 0.85 },
    skor_akhir_smart: 0.8900,
    nilai_skala_100: 89.00,
    peringkat: 2,
    keterangan_nilai: 'Baik',
  },
  {
    id: 'm3333333-3333-3333-3333-333333333333',
    kode_alternatif: 'A3',
    nama: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@upnyk.ac.id',
    nim: '20241002',
    institusi: 'Universitas Pembangunan Nasional',
    bagian: 'Marketing & PR',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '0812-3456-7803',
    status: 'Aktif',
    nilai_kriteria: { C1: 90, C2: 95, C3: 85 },
    utility: { C1: 0.90, C2: 0.95, C3: 0.85 },
    skor_akhir_smart: 0.8850,
    nilai_skala_100: 88.50,
    peringkat: 3,
    keterangan_nilai: 'Baik',
  },
  {
    id: 'm4444444-4444-4444-4444-444444444444',
    kode_alternatif: 'A4',
    nama: 'Budi Santoso',
    email: 'budi.santoso@students.uii.ac.id',
    nim: '20241003',
    institusi: 'Universitas Islam Indonesia',
    bagian: 'Accounting & Finance',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '0812-3456-7804',
    status: 'Aktif',
    nilai_kriteria: { C1: 80, C2: 85, C3: 75 },
    utility: { C1: 0.80, C2: 0.85, C3: 0.75 },
    skor_akhir_smart: 0.7850,
    nilai_skala_100: 78.50,
    peringkat: 4,
    keterangan_nilai: 'Cukup',
  },
  {
    id: 'm5555555-5555-5555-5555-555555555555',
    kode_alternatif: 'A5',
    nama: 'Dika Pratama',
    email: 'dika.pratama@ity.ac.id',
    nim: '20241005',
    institusi: 'Institut Teknologi Yogyakarta',
    bagian: 'IT / Infrastructure',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '0812-3456-7805',
    status: 'Aktif',
    nilai_kriteria: { C1: 75, C2: 80, C3: 70 },
    utility: { C1: 0.75, C2: 0.80, C3: 0.70 },
    skor_akhir_smart: 0.7350,
    nilai_skala_100: 73.50,
    peringkat: 5,
    keterangan_nilai: 'Cukup',
  },
];

// In-Memory Database Store with file sync
let dbMahasiswa: MahasiswaRecord[] = [...INITIAL_MAHASISWA];
let dbKriteria: KriteriaRecord[] = [...INITIAL_KRITERIA];
let dbAuditLogs: AuditLogRecord[] = [
  {
    id: 'l1111111-1111-1111-1111-111111111111',
    aktor: 'Siti Rahma, S.Psi. (HRD)',
    role: 'admin',
    aksi: 'Input Penilaian Mahasiswa',
    rincian: 'Memperbarui skor kedisiplinan dan kinerja C1, C2, C3 untuk 5 mahasiswa Periode 1 - 2025.',
    waktu: '2025-01-15 14:30 WIB',
  },
  {
    id: 'l2222222-2222-2222-2222-222222222222',
    aktor: 'Bpk. H. Rekso (Founder & CEO)',
    role: 'super_admin',
    aksi: 'Pengesahan Peringkat SMART',
    rincian: 'Mengesahkan penetapan Peringkat 1 untuk Andi Pratama (andi.pratama@mail.ugm.ac.id) dengan skor akhir SMART 0.9250.',
    waktu: '2025-01-16 09:15 WIB',
  },
  {
    id: 'l3333333-3333-3333-3333-333333333333',
    aktor: 'Siti Rahma, S.Psi. (HRD)',
    role: 'admin',
    aksi: 'Ekspor Data Mahasiswa',
    rincian: 'Mengekspor rekapitulasi data mahasiswa PKL dalam format CSV dan JSON dengan email mahasiswa.',
    waktu: '2025-01-17 11:20 WIB',
  },
];

let dbSKJuara: SKJuaraRecord = {
  nomor_sk: 'SK/7INC/PKL-SMART/2025/001',
  periode: 'Periode 1 - 2025',
  pemenang: {
    nama: 'Andi Pratama',
    email: 'andi.pratama@mail.ugm.ac.id',
    bagian: 'IT / Software Engineering',
    skor_akhir_smart: 0.9250,
    nilai_skala_100: 92.50,
    predikat: 'Sangat Baik',
  },
  disahkan_oleh: 'Bpk. H. Rekso (Founder & CEO)',
  status: 'Sah & Diterbitkan',
  tanggal_pengesahan: '2025-01-16 09:15:00 WIB',
};

// SMART Engine Calculation Function
function hitungEngineSMART(students: MahasiswaRecord[], kriteria: KriteriaRecord[]) {
  const activeKrit = kriteria.filter((k) => k.aktif).sort((a, b) => a.urutan - b.urutan);
  const totalRawBobot = activeKrit.reduce((sum, k) => sum + k.bobot_awal, 0) || 100;

  // 1. Normalisasi Bobot
  const bobotNormal: Record<string, number> = {};
  activeKrit.forEach((k) => {
    bobotNormal[k.kode] = Number((k.bobot_awal / totalRawBobot).toFixed(4));
  });

  // 2. Utilitas, Nilai Akhir Vi, Skala 100
  const evaluated = students.map((m) => {
    const rawC1 = Number(m.nilai_kriteria?.C1 ?? 80);
    const rawC2 = Number(m.nilai_kriteria?.C2 ?? 80);
    const rawC3 = Number(m.nilai_kriteria?.C3 ?? 80);

    // Benefit utility: u_ij = x_ij / 100
    const u1 = Number((rawC1 / 100).toFixed(4));
    const u2 = Number((rawC2 / 100).toFixed(4));
    const u3 = Number((rawC3 / 100).toFixed(4));

    // Overall Value Vi = sum(w_j * u_ij)
    const w1 = bobotNormal['C1'] ?? 0.3;
    const w2 = bobotNormal['C2'] ?? 0.2;
    const w3 = bobotNormal['C3'] ?? 0.5;

    const c1 = Number((w1 * u1).toFixed(4));
    const c2 = Number((w2 * u2).toFixed(4));
    const c3 = Number((w3 * u3).toFixed(4));

    const skorAkhir = Number((w1 * u1 + w2 * u2 + w3 * u3).toFixed(4));
    const skala100 = Number((skorAkhir * 100).toFixed(2));

    let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' = 'Kurang';
    if (skala100 >= 90) predikat = 'Sangat Baik';
    else if (skala100 >= 80) predikat = 'Baik';
    else if (skala100 >= 70) predikat = 'Cukup';

    return {
      ...m,
      nilai_kriteria: { C1: rawC1, C2: rawC2, C3: rawC3 },
      utility: { C1: u1, C2: u2, C3: u3 },
      kontribusi: { C1: c1, C2: c2, C3: c3 },
      skor_akhir_smart: skorAkhir,
      nilai_skala_100: skala100,
      keterangan_nilai: predikat,
    };
  });

  // 3. Perangkingan
  evaluated.sort((a, b) => (b.skor_akhir_smart || 0) - (a.skor_akhir_smart || 0));
  evaluated.forEach((item, index) => {
    item.peringkat = index + 1;
  });

  return {
    bobotNormal,
    totalMahasiswa: evaluated.length,
    ranking: evaluated,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ---------------------------------------------------------------------------
  // 1. HEALTH CHECK & SYSTEM DIAGNOSTICS
  // ---------------------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SPK Penilaian Mahasiswa PKL PT Seven Inc.',
      database: 'PostgreSQL Architecture',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // ---------------------------------------------------------------------------
  // 2. FITUR BACKEND AKTOR 1: SUPER ADMIN (FOUNDER & PEMILIK PT SEVEN INC.)
  // ---------------------------------------------------------------------------
  // GET: Dashboard Eksekutif Founder
  app.get('/api/founder/dashboard', (_req: Request, res: Response) => {
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    const top1 = calc.ranking[0];

    const avgC1 = Number((dbMahasiswa.reduce((sum, m) => sum + m.nilai_kriteria.C1, 0) / dbMahasiswa.length).toFixed(1));
    const avgC2 = Number((dbMahasiswa.reduce((sum, m) => sum + m.nilai_kriteria.C2, 0) / dbMahasiswa.length).toFixed(1));
    const avgC3 = Number((dbMahasiswa.reduce((sum, m) => sum + m.nilai_kriteria.C3, 0) / dbMahasiswa.length).toFixed(1));

    res.json({
      success: true,
      executive_summary: {
        total_mahasiswa_pkl: dbMahasiswa.length,
        status_periode: 'Periode 1 - 2025 (Aktif)',
        rata_rata_kriteria: {
          C1_Kehadiran: avgC1,
          C2_Ketepatan_Waktu: avgC2,
          C3_Penyelesaian_Tugas: avgC3,
        },
        juara_1: top1 ? {
          nama: top1.nama,
          email: top1.email,
          bagian: top1.bagian,
          skor_akhir_smart: top1.skor_akhir_smart,
          nilai_skala_100: top1.nilai_skala_100,
          predikat: top1.keterangan_nilai,
        } : null,
        pengesahan_sk: dbSKJuara,
      },
    });
  });

  // GET: Pengawasan & Audit Log Independen
  app.get('/api/founder/audit-logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      total_logs: dbAuditLogs.length,
      logs: dbAuditLogs,
    });
  });

  // POST: Pengesahan Resmi SK Juara 1 & Sertifikat oleh Founder
  app.post('/api/founder/sahkan-sk', (req: Request, res: Response) => {
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    const top1 = calc.ranking[0];

    if (!top1) {
      return res.status(400).json({ success: false, message: 'Tidak ada data mahasiswa untuk disahkan.' });
    }

    const nomorSK = `SK/7INC/PKL-SMART/2025/${String(Date.now()).slice(-4)}`;
    dbSKJuara = {
      nomor_sk: nomorSK,
      periode: 'Periode 1 - 2025',
      pemenang: {
        nama: top1.nama,
        email: top1.email,
        bagian: top1.bagian,
        skor_akhir_smart: top1.skor_akhir_smart || 0.9250,
        nilai_skala_100: top1.nilai_skala_100 || 92.50,
        predikat: top1.keterangan_nilai || 'Sangat Baik',
      },
      disahkan_oleh: 'Bpk. H. Rekso (Founder & CEO)',
      status: 'Sah & Diterbitkan',
      tanggal_pengesahan: new Date().toLocaleString('id-ID'),
    };

    // Record audit trail
    dbAuditLogs.unshift({
      id: `log-${Date.now()}`,
      aktor: 'Bpk. H. Rekso (Founder & CEO)',
      role: 'super_admin',
      aksi: 'Pengesahan SK Juara 1',
      rincian: `Founder telah menandatangani & mengesahkan SK Nomor ${nomorSK} untuk pemenang ${top1.nama} (${top1.email}).`,
      waktu: new Date().toLocaleString('id-ID'),
    });

    res.json({
      success: true,
      message: 'Surat Keputusan Juara 1 PKL berhasil disahkan oleh Founder!',
      sk_juara: dbSKJuara,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. FITUR BACKEND AKTOR 2: ADMIN HRD (PENGELOLA OPERASIONAL PKL)
  // ---------------------------------------------------------------------------
  // GET: Seluruh Mahasiswa PKL
  app.get('/api/mahasiswa', (_req: Request, res: Response) => {
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    res.json({
      success: true,
      total: calc.ranking.length,
      data: calc.ranking,
    });
  });

  // POST: Tambah / Edit Mahasiswa PKL
  app.post('/api/mahasiswa', (req: Request, res: Response) => {
    const { nama, email, institusi, bagian, nilai_kriteria } = req.body;

    if (!nama || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan Email Mahasiswa wajib diisi.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existingIdx = dbMahasiswa.findIndex((m) => m.email.toLowerCase() === cleanEmail);

    const c1 = Math.max(0, Math.min(100, Number(nilai_kriteria?.C1 ?? 80)));
    const c2 = Math.max(0, Math.min(100, Number(nilai_kriteria?.C2 ?? 80)));
    const c3 = Math.max(0, Math.min(100, Number(nilai_kriteria?.C3 ?? 80)));

    let studentRecord: MahasiswaRecord;

    if (existingIdx >= 0) {
      studentRecord = {
        ...dbMahasiswa[existingIdx],
        nama: String(nama).trim(),
        email: cleanEmail,
        institusi: institusi || dbMahasiswa[existingIdx].institusi,
        bagian: bagian || dbMahasiswa[existingIdx].bagian,
        nilai_kriteria: { C1: c1, C2: c2, C3: c3 },
      };
      dbMahasiswa[existingIdx] = studentRecord;
    } else {
      const nextNum = dbMahasiswa.length + 1;
      studentRecord = {
        id: `mhs-${Date.now()}`,
        kode_alternatif: `A${nextNum}`,
        nama: String(nama).trim(),
        email: cleanEmail,
        nim: req.body.nim || `2024100${nextNum}`,
        institusi: institusi || 'PT Seven Inc.',
        bagian: bagian || 'IT / Software Engineering',
        periode: 'Periode 1 - 2025',
        tanggal_mulai: '2025-01-01',
        tanggal_selesai: '2025-06-30',
        no_hp: req.body.no_hp || '0812-3456-7890',
        status: 'Aktif',
        nilai_kriteria: { C1: c1, C2: c2, C3: c3 },
      };
      dbMahasiswa.push(studentRecord);
    }

    // Recalculate SMART scores
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    dbMahasiswa = calc.ranking;

    // Log action
    dbAuditLogs.unshift({
      id: `log-${Date.now()}`,
      aktor: 'Siti Rahma, S.Psi. (HRD)',
      role: 'admin',
      aksi: existingIdx >= 0 ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru',
      rincian: `Memperbarui data dan nilai SMART untuk mahasiswa ${studentRecord.nama} (${studentRecord.email}).`,
      waktu: new Date().toLocaleString('id-ID'),
    });

    res.json({
      success: true,
      message: 'Data mahasiswa PKL berhasil disimpan.',
      data: studentRecord,
    });
  });

  // DELETE: Hapus Mahasiswa PKL
  app.delete('/api/mahasiswa/:idOrEmail', (req: Request, res: Response) => {
    const target = req.params.idOrEmail;
    const initialLen = dbMahasiswa.length;
    const removed = dbMahasiswa.find((m) => m.id === target || m.email.toLowerCase() === target.toLowerCase());

    dbMahasiswa = dbMahasiswa.filter((m) => m.id !== target && m.email.toLowerCase() !== target.toLowerCase());

    if (dbMahasiswa.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
    }

    if (removed) {
      dbAuditLogs.unshift({
        id: `log-${Date.now()}`,
        aktor: 'Siti Rahma, S.Psi. (HRD)',
        role: 'admin',
        aksi: 'Hapus Mahasiswa',
        rincian: `Menghapus data mahasiswa ${removed.nama} (${removed.email}) dari perhitungan SMART.`,
        waktu: new Date().toLocaleString('id-ID'),
      });
    }

    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    dbMahasiswa = calc.ranking;

    res.json({ success: true, message: 'Mahasiswa berhasil dihapus.' });
  });

  // GET: Kriteria SMART & Bobot
  app.get('/api/kriteria', (_req: Request, res: Response) => {
    res.json({
      success: true,
      kriteria: dbKriteria,
      total_bobot: dbKriteria.reduce((sum, k) => sum + k.bobot_awal, 0),
    });
  });

  // POST: Hitung Engine SMART Server-Side
  app.post('/api/smart/hitung', (req: Request, res: Response) => {
    const studentsInput = req.body.mahasiswa || dbMahasiswa;
    const kriteriaInput = req.body.kriteria || dbKriteria;

    const result = hitungEngineSMART(studentsInput, kriteriaInput);
    res.json({
      success: true,
      metode: 'SMART (Simple Multi Attribute Rating Technique)',
      perusahaan: 'PT Seven Inc.',
      formula: {
        normalisasi_bobot: 'w_j = b_j / sum(b_k)',
        utilitas_benefit: 'u_ij = x_ij / 100',
        nilai_akhir: 'V_i = sum(w_j * u_ij)',
      },
      hasil: result,
    });
  });

  // POST: Import Batch Mahasiswa dari File Excel & Update Otomatis Perhitungan SMART
  app.post('/api/smart/import-batch', (req: Request, res: Response) => {
    const { mahasiswa, replaceExisting } = req.body;

    if (!Array.isArray(mahasiswa) || mahasiswa.length === 0) {
      return res.status(400).json({ success: false, message: 'Data array mahasiswa dari file Excel tidak valid atau kosong.' });
    }

    if (replaceExisting) {
      dbMahasiswa = mahasiswa.map((m, idx) => ({
        ...m,
        id: m.id || `mhs-batch-${Date.now()}-${idx}`,
        kode_alternatif: m.kode_alternatif || `A${idx + 1}`,
        email: String(m.email).trim().toLowerCase(),
      }));
    } else {
      // Upsert / merge
      mahasiswa.forEach((m, idx) => {
        const cleanEmail = String(m.email).trim().toLowerCase();
        const existingIdx = dbMahasiswa.findIndex((x) => x.email.toLowerCase() === cleanEmail);
        const record = {
          ...m,
          id: m.id || `mhs-batch-${Date.now()}-${idx}`,
          kode_alternatif: m.kode_alternatif || `A${dbMahasiswa.length + 1}`,
          email: cleanEmail,
        };
        if (existingIdx >= 0) {
          dbMahasiswa[existingIdx] = { ...dbMahasiswa[existingIdx], ...record };
        } else {
          dbMahasiswa.push(record);
        }
      });
    }

    // Run SMART calculation automatically
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    dbMahasiswa = calc.ranking;

    // Record audit trail
    dbAuditLogs.unshift({
      id: `log-${Date.now()}`,
      aktor: 'Admin HRD (Siti Rahma, S.Psi.)',
      role: 'admin',
      aksi: 'Import File Excel SMART',
      rincian: `Berhasil mengimpor ${mahasiswa.length} data mahasiswa dari file Excel dan menjalankan otomasi kalkulasi SMART.`,
      waktu: new Date().toLocaleString('id-ID'),
    });

    res.json({
      success: true,
      message: `Berhasil memproses ${mahasiswa.length} data mahasiswa dari file Excel. Perhitungan SMART otomatis terupdate!`,
      total_mahasiswa: dbMahasiswa.length,
      hasil: calc,
    });
  });

  // ---------------------------------------------------------------------------
  // 4. FITUR BACKEND AKTOR 3: MAHASISWA PKL (IDENTITAS EMAIL)
  // ---------------------------------------------------------------------------
  // GET: Profil & Transkrip Nilai Mandiri Mahasiswa
  app.get('/api/mahasiswa/profil/:email', (req: Request, res: Response) => {
    const email = req.params.email.toLowerCase();
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    const mhs = calc.ranking.find((m) => m.email.toLowerCase() === email);

    if (!mhs) {
      return res.status(404).json({ success: false, message: 'Data mahasiswa dengan email tersebut tidak ditemukan.' });
    }

    res.json({
      success: true,
      mahasiswa: {
        nama: mhs.nama,
        email: mhs.email,
        institusi: mhs.institusi,
        bagian: mhs.bagian,
        periode: mhs.periode,
        status: mhs.status,
      },
      transkrip_smart: {
        nilai_mentah: mhs.nilai_kriteria,
        nilai_utilitas: mhs.utility,
        kontribusi_kriteria: (mhs as any).kontribusi,
        nilai_akhir_smart: mhs.skor_akhir_smart,
        nilai_skala_100: mhs.nilai_skala_100,
        peringkat: mhs.peringkat,
        predikat: mhs.keterangan_nilai,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 5. FITUR DATABASE & EKSPOR BERKAS RESMI POSTGRESQL
  // ---------------------------------------------------------------------------
  // GET: Download / Stream PostgreSQL Dump Script
  app.get('/api/database/dump', (_req: Request, res: Response) => {
    const dumpPath = path.resolve(__dirname, 'database_spk_seveninc.sql');
    if (fs.existsSync(dumpPath)) {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="database_spk_seveninc.sql"');
      return res.sendFile(dumpPath);
    }
    res.status(404).send('File database tidak ditemukan.');
  });

  // GET: Download CSV Resmi Mahasiswa PKL
  app.get('/api/export/csv', (_req: Request, res: Response) => {
    const calc = hitungEngineSMART(dbMahasiswa, dbKriteria);
    const headers = [
      'Peringkat',
      'Kode Alternatif',
      'Email Mahasiswa',
      'Nama Mahasiswa',
      'Institusi',
      'Bagian / Divisi',
      'Kehadiran (C1)',
      'Ketepatan Waktu (C2)',
      'Penyelesaian Tugas (C3)',
      'Nilai Akhir SMART (Vi)',
      'Nilai Skala 100',
      'Keterangan',
    ].join(',');

    const rows = calc.ranking.map((item) =>
      [
        item.peringkat,
        item.kode_alternatif,
        `"${item.email}"`,
        `"${item.nama}"`,
        `"${item.institusi}"`,
        `"${item.bagian}"`,
        item.nilai_kriteria.C1,
        item.nilai_kriteria.C2,
        item.nilai_kriteria.C3,
        item.skor_akhir_smart?.toFixed(4),
        item.nilai_skala_100?.toFixed(2),
        `"${item.keterangan_nilai}"`,
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rekap_smart_mahasiswa_pkl.csv"');
    res.send(csvContent);
  });

  // POST: Reset Database ke Benchmark Awal
  app.post('/api/database/reset', (_req: Request, res: Response) => {
    dbMahasiswa = [...INITIAL_MAHASISWA];
    dbKriteria = [...INITIAL_KRITERIA];
    dbAuditLogs.unshift({
      id: `log-${Date.now()}`,
      aktor: 'Sistem Admin',
      role: 'admin',
      aksi: 'Reset Data',
      rincian: 'Mengembalikan data penilaian ke 5 benchmark awal (Andi, Rina, Siti, Budi, Dika).',
      waktu: new Date().toLocaleString('id-ID'),
    });

    res.json({ success: true, message: 'Database telah direset ke nilai benchmark awal.' });
  });

  // ---------------------------------------------------------------------------
  // 6. VITE DEV SERVER MIDDLEWARE / STATIC ASSETS SERVING
  // ---------------------------------------------------------------------------
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SPK SMART Backend & Frontend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
