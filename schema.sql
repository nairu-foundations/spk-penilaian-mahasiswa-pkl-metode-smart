-- =====================================================================
-- SCHEMA.SQL: Skema Database PostgreSQL SPK Penilaian Mahasiswa PKL
-- Perusahaan : PT Seven Inc.
-- Metode     : SMART (Simple Multi Attribute Rating Technique)
-- Fitur      : Sesuai atribut dan kriteria masing-masing aktor:
--              1. Super Admin (Founder & Pemilik PT Seven Inc.)
--              2. Admin HRD (Pengelola Operasional Penilaian PKL)
--              3. Mahasiswa PKL (Peserta Magang dengan Identitas Email)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE role_aktor_type AS ENUM ('super_admin', 'admin', 'mahasiswa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE kriteria_smart_type AS ENUM ('benefit', 'cost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_magang_type AS ENUM ('Aktif', 'Selesai', 'Menunggu Verifikasi');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL PENGGUNA & AKTOR (Multi-Role RBAC PT Seven Inc.)
CREATE TABLE IF NOT EXISTS public.pengguna_aktor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'pbkdf2_sha256$default',
  role role_aktor_type NOT NULL DEFAULT 'mahasiswa',
  jabatan VARCHAR(150) NOT NULL,
  kuasa_penuh BOOLEAN NOT NULL DEFAULT false,
  no_hp VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL PERIODE PKL
CREATE TABLE IF NOT EXISTS public.periode_pkl (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_periode VARCHAR(100) NOT NULL UNIQUE,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL KRITERIA SMART (3 Kriteria Benefit Baku)
CREATE TABLE IF NOT EXISTS public.kriteria_smart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode VARCHAR(10) UNIQUE NOT NULL, -- C1, C2, C3
  nama VARCHAR(150) NOT NULL,
  tipe kriteria_smart_type NOT NULL DEFAULT 'benefit',
  bobot_awal NUMERIC(6,2) NOT NULL DEFAULT 30.00, -- e.g. 30, 20, 50
  bobot_normal NUMERIC(6,4) NOT NULL DEFAULT 0.3000, -- e.g. 0.30, 0.20, 0.50
  deskripsi TEXT,
  urutan INT NOT NULL DEFAULT 1,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL MAHASISWA PKL (Identitas Utama: Email Mahasiswa)
CREATE TABLE IF NOT EXISTS public.mahasiswa_pkl (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_alternatif VARCHAR(10) NOT NULL UNIQUE, -- A1, A2, A3, dst.
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL, -- IDENTITAS KUNCI UTAMA
  nim VARCHAR(50), -- Opsional nomor induk akademik kampus
  institusi VARCHAR(150) NOT NULL DEFAULT 'PT Seven Inc.',
  bagian VARCHAR(150) NOT NULL, -- Divisi penempatan kerja
  periode_id UUID REFERENCES public.periode_pkl(id) ON DELETE SET NULL,
  periode VARCHAR(100) NOT NULL DEFAULT 'Periode 1 - 2025',
  tanggal_mulai DATE NOT NULL DEFAULT '2025-01-01',
  tanggal_selesai DATE NOT NULL DEFAULT '2025-06-30',
  no_hp VARCHAR(50) NOT NULL DEFAULT '0812-3456-7890',
  status status_magang_type NOT NULL DEFAULT 'Aktif',
  skor_akhir_smart NUMERIC(8,4) DEFAULT 0.0000,
  nilai_skala_100 NUMERIC(6,2) DEFAULT 0.00,
  peringkat INT DEFAULT 0,
  keterangan_nilai VARCHAR(50) DEFAULT 'Cukup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL PENILAIAN MAHASISWA (Matriks Nilai Kinerja C1, C2, C3)
CREATE TABLE IF NOT EXISTS public.penilaian_mahasiswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mahasiswa_id UUID NOT NULL REFERENCES public.mahasiswa_pkl(id) ON DELETE CASCADE,
  kriteria_id UUID NOT NULL REFERENCES public.kriteria_smart(id) ON DELETE CASCADE,
  nilai_mentah NUMERIC(6,2) NOT NULL CHECK (nilai_mentah >= 0 AND nilai_mentah <= 100),
  nilai_utilitas NUMERIC(6,4) NOT NULL DEFAULT 0.0000, -- nilai_mentah / 100
  kontribusi NUMERIC(8,4) NOT NULL DEFAULT 0.0000, -- bobot_normal * nilai_utilitas
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mahasiswa_id, kriteria_id)
);

-- 8. TABEL AUDIT LOGS (Pengawasan Independen Founder & Pemilik)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aktor VARCHAR(150) NOT NULL,
  role role_aktor_type NOT NULL,
  aksi VARCHAR(150) NOT NULL,
  rincian TEXT NOT NULL,
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  waktu TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABEL PENGESAHAN SK JUARA PKL (Otoritas Eksekutif Founder)
CREATE TABLE IF NOT EXISTS public.pengesahan_sk_juara (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_sk VARCHAR(100) UNIQUE NOT NULL,
  periode VARCHAR(100) NOT NULL,
  mahasiswa_id UUID REFERENCES public.mahasiswa_pkl(id) ON DELETE SET NULL,
  nama_pemenang VARCHAR(150) NOT NULL,
  email_pemenang VARCHAR(150) NOT NULL,
  skor_smart NUMERIC(8,4) NOT NULL,
  nilai_skala_100 NUMERIC(6,2) NOT NULL,
  predikat VARCHAR(50) NOT NULL,
  disahkan_oleh VARCHAR(150) NOT NULL DEFAULT 'Bpk. H. Rekso (Founder & CEO)',
  status_pengesahan VARCHAR(50) NOT NULL DEFAULT 'Sah & Diterbitkan',
  tanggal_pengesahan TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABEL SITE SETTINGS / CMS
CREATE TABLE IF NOT EXISTS public.site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  tipe VARCHAR(20) NOT NULL DEFAULT 'text',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- INDEXES & CONSTRAINTS UNTUK OPTIMASI QUERY
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_mhs_email ON public.mahasiswa_pkl(email);
CREATE INDEX IF NOT EXISTS idx_mhs_periode ON public.mahasiswa_pkl(periode);
CREATE INDEX IF NOT EXISTS idx_mhs_peringkat ON public.mahasiswa_pkl(peringkat);
CREATE INDEX IF NOT EXISTS idx_penilaian_mhs ON public.penilaian_mahasiswa(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_penilaian_kriteria ON public.penilaian_mahasiswa(kriteria_id);
CREATE INDEX IF NOT EXISTS idx_audit_waktu ON public.audit_logs(waktu DESC);

-- =====================================================================
-- VIEW OTOMATIS: REKAPITULASI & PERANGKINGAN METODE SMART
-- =====================================================================
CREATE OR REPLACE VIEW public.v_rekap_smart_mahasiswa AS
WITH perhitungan_utilitas AS (
  SELECT
    m.id AS mahasiswa_id,
    m.kode_alternatif,
    m.nama,
    m.email,
    m.bagian,
    m.institusi,
    m.periode,
    k.kode AS kode_kriteria,
    p.nilai_mentah,
    -- Formula SMART Benefit: u_ij = x_ij / 100
    ROUND(p.nilai_mentah / 100.0, 4) AS utilitas,
    -- Kontribusi: w_j * u_ij
    ROUND(k.bobot_normal * (p.nilai_mentah / 100.0), 4) AS kontribusi
  FROM public.mahasiswa_pkl m
  JOIN public.penilaian_mahasiswa p ON p.mahasiswa_id = m.id
  JOIN public.kriteria_smart k ON k.id = p.kriteria_id
  WHERE k.aktif = true
),
skor_total AS (
  SELECT
    mahasiswa_id,
    kode_alternatif,
    nama,
    email,
    bagian,
    institusi,
    periode,
    ROUND(SUM(kontribusi), 4) AS skor_akhir_smart,
    ROUND(SUM(kontribusi) * 100.0, 2) AS nilai_skala_100,
    CASE
      WHEN SUM(kontribusi) >= 0.9000 THEN 'Sangat Baik'
      WHEN SUM(kontribusi) >= 0.8000 THEN 'Baik'
      WHEN SUM(kontribusi) >= 0.7000 THEN 'Cukup'
      ELSE 'Kurang'
    END AS predikat
  FROM perhitungan_utilitas
  GROUP BY mahasiswa_id, kode_alternatif, nama, email, bagian, institusi, periode
)
SELECT
  DENSE_RANK() OVER (ORDER BY skor_akhir_smart DESC) AS peringkat,
  kode_alternatif,
  nama,
  email,
  bagian,
  institusi,
  periode,
  skor_akhir_smart,
  nilai_skala_100,
  predikat
FROM skor_total;
