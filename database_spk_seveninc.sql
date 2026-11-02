-- =====================================================================
-- DATABASE_SPK_SEVENINC.SQL
-- DUMP DATABASE POSTGRESQL LENGKAP SPK PENILAIAN MAHASISWA PKL METODE SMART
-- PT SEVEN INC.
-- =====================================================================

BEGIN;

-- DROP EXISTING TABLES IN CASCADE ORDER
DROP VIEW IF EXISTS public.v_rekap_smart_mahasiswa CASCADE;
DROP TABLE IF EXISTS public.pengesahan_sk_juara CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.penilaian_mahasiswa CASCADE;
DROP TABLE IF EXISTS public.mahasiswa_pkl CASCADE;
DROP TABLE IF EXISTS public.kriteria_smart CASCADE;
DROP TABLE IF EXISTS public.periode_pkl CASCADE;
DROP TABLE IF EXISTS public.pengguna_aktor CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- 1. TABEL PENGGUNA & AKTOR
CREATE TABLE public.pengguna_aktor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('super_admin', 'admin', 'mahasiswa')),
  jabatan VARCHAR(150) NOT NULL,
  kuasa_penuh BOOLEAN NOT NULL DEFAULT false,
  no_hp VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL PERIODE PKL
CREATE TABLE public.periode_pkl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_periode VARCHAR(100) NOT NULL UNIQUE,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL KRITERIA SMART
CREATE TABLE public.kriteria_smart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(150) NOT NULL,
  tipe VARCHAR(20) NOT NULL DEFAULT 'benefit' CHECK (tipe IN ('benefit', 'cost')),
  bobot_awal NUMERIC(6,2) NOT NULL,
  bobot_normal NUMERIC(6,4) NOT NULL,
  deskripsi TEXT,
  urutan INT NOT NULL DEFAULT 1,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL MAHASISWA PKL
CREATE TABLE public.mahasiswa_pkl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_alternatif VARCHAR(10) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  nim VARCHAR(50),
  institusi VARCHAR(150) NOT NULL,
  bagian VARCHAR(150) NOT NULL,
  periode VARCHAR(100) NOT NULL DEFAULT 'Periode 1 - 2025',
  tanggal_mulai DATE NOT NULL DEFAULT '2025-01-01',
  tanggal_selesai DATE NOT NULL DEFAULT '2025-06-30',
  no_hp VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai', 'Menunggu Verifikasi')),
  skor_akhir_smart NUMERIC(8,4) DEFAULT 0.0000,
  nilai_skala_100 NUMERIC(6,2) DEFAULT 0.00,
  peringkat INT DEFAULT 0,
  keterangan_nilai VARCHAR(50) DEFAULT 'Cukup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL MATRIKS PENILAIAN MAHASISWA
CREATE TABLE public.penilaian_mahasiswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES public.mahasiswa_pkl(id) ON DELETE CASCADE,
  kriteria_id UUID NOT NULL REFERENCES public.kriteria_smart(id) ON DELETE CASCADE,
  nilai_mentah NUMERIC(6,2) NOT NULL CHECK (nilai_mentah >= 0 AND nilai_mentah <= 100),
  nilai_utilitas NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
  kontribusi NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mahasiswa_id, kriteria_id)
);

-- 6. TABEL AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aktor VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL,
  aksi VARCHAR(150) NOT NULL,
  rincian TEXT NOT NULL,
  waktu TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL PENGESAHAN SK JUARA
CREATE TABLE public.pengesahan_sk_juara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_sk VARCHAR(100) UNIQUE NOT NULL,
  periode VARCHAR(100) NOT NULL,
  mahasiswa_id UUID REFERENCES public.mahasiswa_pkl(id),
  nama_pemenang VARCHAR(150) NOT NULL,
  email_pemenang VARCHAR(150) NOT NULL,
  skor_smart NUMERIC(8,4) NOT NULL,
  nilai_skala_100 NUMERIC(6,2) NOT NULL,
  predikat VARCHAR(50) NOT NULL,
  disahkan_oleh VARCHAR(150) NOT NULL,
  status_pengesahan VARCHAR(50) NOT NULL DEFAULT 'Sah & Diterbitkan',
  tanggal_pengesahan TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. VIEW PERANGKINGAN SMART OTOMATIS
CREATE OR REPLACE VIEW public.v_rekap_smart_mahasiswa AS
WITH perhitungan AS (
  SELECT
    m.id AS mahasiswa_id,
    m.kode_alternatif,
    m.nama,
    m.email,
    m.bagian,
    m.institusi,
    ROUND(SUM(k.bobot_normal * (p.nilai_mentah / 100.0)), 4) AS skor_akhir_smart,
    ROUND(SUM(k.bobot_normal * (p.nilai_mentah / 100.0)) * 100.0, 2) AS nilai_skala_100,
    CASE
      WHEN SUM(k.bobot_normal * (p.nilai_mentah / 100.0)) >= 0.9000 THEN 'Sangat Baik'
      WHEN SUM(k.bobot_normal * (p.nilai_mentah / 100.0)) >= 0.8000 THEN 'Baik'
      WHEN SUM(k.bobot_normal * (p.nilai_mentah / 100.0)) >= 0.7000 THEN 'Cukup'
      ELSE 'Kurang'
    END AS predikat
  FROM public.mahasiswa_pkl m
  JOIN public.penilaian_mahasiswa p ON p.mahasiswa_id = m.id
  JOIN public.kriteria_smart k ON k.id = p.kriteria_id
  WHERE k.aktif = true
  GROUP BY m.id, m.kode_alternatif, m.nama, m.email, m.bagian, m.institusi
)
SELECT
  DENSE_RANK() OVER (ORDER BY skor_akhir_smart DESC) AS peringkat,
  kode_alternatif,
  nama,
  email,
  bagian,
  institusi,
  skor_akhir_smart,
  nilai_skala_100,
  predikat
FROM perhitungan;

-- =====================================================================
-- INSERT SEED DATA RESMI (MENGGUNAKAN UUID HEX MURNI)
-- =====================================================================

-- Aktor
INSERT INTO public.pengguna_aktor (id, nama, email, password_hash, role, jabatan, kuasa_penuh) VALUES
('11111111-1111-4111-8111-111111111111', 'Bpk. H. Rekso (Founder & CEO)', 'founder@seveninc.co.id', 'founder123', 'super_admin', 'Pemilik Perusahaan (Kuasa Penuh)', true),
('22222222-2222-4222-8222-222222222222', 'Siti Rahma, S.Psi. (HRD Officer)', 'hrd@seveninc.co.id', 'hrd123', 'admin', 'HRD Pengelola Dashboard Operasional Penilaian PKL', false),
('33333333-3333-4333-8333-333333333331', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id', 'mhs123', 'mahasiswa', 'Peserta Magang IT / Software Engineering', false),
('33333333-3333-4333-8333-333333333332', 'Rina Anggraini', 'rina.anggraini@student.uny.ac.id', 'mhs123', 'mahasiswa', 'Peserta Magang HRD & Talent Development', false),
('33333333-3333-4333-8333-333333333333', 'Siti Nurhaliza', 'siti.nurhaliza@upnyk.ac.id', 'mhs123', 'mahasiswa', 'Peserta Magang Marketing & PR', false),
('33333333-3333-4333-8333-333333333334', 'Budi Santoso', 'budi.santoso@students.uii.ac.id', 'mhs123', 'mahasiswa', 'Peserta Magang Accounting & Finance', false),
('33333333-3333-4333-8333-333333333335', 'Dika Pratama', 'dika.pratama@ity.ac.id', 'mhs123', 'mahasiswa', 'Peserta Magang IT / Infrastructure', false);

-- Periode
INSERT INTO public.periode_pkl (id, nama_periode, tanggal_mulai, tanggal_selesai, status) VALUES
('c1111111-1111-4111-8111-111111111111', 'Periode 1 - 2025', '2025-01-01', '2025-06-30', 'Aktif');

-- Kriteria
INSERT INTO public.kriteria_smart (id, kode, nama, tipe, bobot_awal, bobot_normal, deskripsi, urutan, aktif) VALUES
('11111111-1111-4111-8111-111111111112', 'C1', 'Kehadiran', 'benefit', 30.00, 0.3000, 'Tingkat presensi dan kedisiplinan partisipasi kerja selama periode PKL di PT Seven Inc. (Skala 0-100)', 1, true),
('22222222-2222-4222-8222-222222222223', 'C2', 'Ketepatan Waktu', 'benefit', 20.00, 0.2000, 'Kepatuhan mahasiswa terhadap jam masuk kerja dan tata tertib operasional kantor (Skala 0-100)', 2, true),
('33333333-3333-4333-8333-333333333334', 'C3', 'Penyelesaian Tugas', 'benefit', 50.00, 0.5000, 'Kemampuan, kualitas hasil, dan kecepatan dalam menuntaskan proyek tugas kerja magang (Skala 0-100)', 3, true);

-- Mahasiswa
INSERT INTO public.mahasiswa_pkl (id, kode_alternatif, nama, email, nim, institusi, bagian, periode, no_hp, status, skor_akhir_smart, nilai_skala_100, peringkat, keterangan_nilai) VALUES
('11111111-1111-4111-8111-111111111113', 'A1', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id', '20241001', 'Universitas Gadjah Mada', 'IT / Software Engineering', 'Periode 1 - 2025', '0812-3456-7801', 'Aktif', 0.9250, 92.50, 1, 'Sangat Baik'),
('22222222-2222-4222-8222-222222222224', 'A2', 'Rina Anggraini', 'rina.anggraini@student.uny.ac.id', '20241004', 'Universitas Negeri Yogyakarta', 'HRD & Talent Development', 'Periode 1 - 2025', '0812-3456-7802', 'Aktif', 0.8900, 89.00, 2, 'Baik'),
('33333333-3333-4333-8333-333333333335', 'A3', 'Siti Nurhaliza', 'siti.nurhaliza@upnyk.ac.id', '20241002', 'Universitas Pembangunan Nasional', 'Marketing & PR', 'Periode 1 - 2025', '0812-3456-7803', 'Aktif', 0.8850, 88.50, 3, 'Baik'),
('44444444-4444-4444-8444-444444444444', 'A4', 'Budi Santoso', 'budi.santoso@students.uii.ac.id', '20241003', 'Universitas Islam Indonesia', 'Accounting & Finance', 'Periode 1 - 2025', '0812-3456-7804', 'Aktif', 0.7850, 78.50, 4, 'Cukup'),
('55555555-5555-4555-8555-555555555555', 'A5', 'Dika Pratama', 'dika.pratama@ity.ac.id', '20241005', 'Institut Teknologi Yogyakarta', 'IT / Infrastructure', 'Periode 1 - 2025', '0812-3456-7805', 'Aktif', 0.7350, 73.50, 5, 'Cukup');

-- Penilaian
INSERT INTO public.penilaian_mahasiswa (mahasiswa_id, kriteria_id, nilai_mentah, nilai_utilitas, kontribusi) VALUES
('11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111112', 95.00, 0.9500, 0.2850),
('11111111-1111-4111-8111-111111111113', '22222222-2222-4222-8222-222222222223', 90.00, 0.9000, 0.1800),
('11111111-1111-4111-8111-111111111113', '33333333-3333-4333-8333-333333333334', 92.00, 0.9200, 0.4600),

('22222222-2222-4222-8222-222222222224', '11111111-1111-4111-8111-111111111112', 95.00, 0.9500, 0.2850),
('22222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222223', 90.00, 0.9000, 0.1800),
('22222222-2222-4222-8222-222222222224', '33333333-3333-4333-8333-333333333334', 85.00, 0.8500, 0.4250),

('33333333-3333-4333-8333-333333333335', '11111111-1111-4111-8111-111111111112', 90.00, 0.9000, 0.2700),
('33333333-3333-4333-8333-333333333335', '22222222-2222-4222-8222-222222222223', 95.00, 0.9500, 0.1900),
('33333333-3333-4333-8333-333333333335', '33333333-3333-4333-8333-333333333334', 85.00, 0.8500, 0.4250),

('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111112', 80.00, 0.8000, 0.2400),
('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222223', 85.00, 0.8500, 0.1700),
('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333334', 75.00, 0.7500, 0.3750),

('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111112', 75.00, 0.7500, 0.2250),
('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222223', 80.00, 0.8000, 0.1600),
('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333334', 70.00, 0.7000, 0.3500);

-- Audit Logs
INSERT INTO public.audit_logs (id, aktor, role, aksi, rincian, waktu) VALUES
('11111111-1111-4111-8111-111111111116', 'Siti Rahma, S.Psi. (HRD)', 'admin', 'Input Penilaian Mahasiswa', 'Memperbarui skor kedisiplinan dan kinerja C1, C2, C3 untuk 5 mahasiswa Periode 1 - 2025.', NOW() - INTERVAL '3 days'),
('22222222-2222-4222-8222-222222222227', 'Bpk. H. Rekso (Founder & CEO)', 'super_admin', 'Pengesahan Peringkat SMART', 'Mengesahkan penetapan Peringkat 1 untuk Andi Pratama (andi.pratama@mail.ugm.ac.id) dengan skor akhir SMART 0.9250.', NOW() - INTERVAL '2 days');

-- Pengesahan SK Juara
INSERT INTO public.pengesahan_sk_juara (id, nomor_sk, periode, mahasiswa_id, nama_pemenang, email_pemenang, skor_smart, nilai_skala_100, predikat, disahkan_oleh) VALUES
('11111111-1111-4111-8111-111111111118', 'SK/7INC/PKL-SMART/2025/001', 'Periode 1 - 2025', '11111111-1111-4111-8111-111111111113', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id', 0.9250, 92.50, 'Sangat Baik', 'Bpk. H. Rekso (Founder & CEO)');

COMMIT;