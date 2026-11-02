-- =====================================================================
-- SEED.SQL: Data Awal PostgreSQL SPK Penilaian Mahasiswa PKL PT Seven Inc.
-- Format    : PostgreSQL SQL (Compatible with psql / Supabase / Cloud SQL)
-- Aktor     :
--   1. Super Admin: Bpk. H. Rekso (Founder & CEO, Kuasa Penuh)
--   2. Admin HRD  : Siti Rahma, S.Psi. (Pengelola Operasional Penilaian)
--   3. Mahasiswa  : Peserta PKL Aktif dengan Identitas Email
-- =====================================================================

-- 1. SEED PENGGUNA & AKTOR
INSERT INTO public.pengguna_aktor (id, nama, email, password_hash, role, jabatan, kuasa_penuh)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Bpk. H. Rekso (Founder & CEO)', 'founder@seveninc.co.id', 'pbkdf2_sha256$founder123', 'super_admin', 'Pemilik Perusahaan (Kuasa Penuh & Pengawas Independen)', true),
('a2222222-2222-2222-2222-222222222222', 'Siti Rahma, S.Psi. (HRD Officer)', 'hrd@seveninc.co.id', 'pbkdf2_sha256$hrd123', 'admin', 'HRD Pengelola Dashboard Operasional Penilaian PKL', false),
('a3333333-3333-3333-3333-333333333331', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id', 'pbkdf2_sha256$mhs123', 'mahasiswa', 'Peserta Magang IT / Software Engineering', false),
('a3333333-3333-3333-3333-333333333332', 'Rina Anggraini', 'rina.anggraini@student.uny.ac.id', 'pbkdf2_sha256$mhs123', 'mahasiswa', 'Peserta Magang HRD & Talent Development', false),
('a3333333-3333-3333-3333-333333333333', 'Siti Nurhaliza', 'siti.nurhaliza@upnyk.ac.id', 'pbkdf2_sha256$mhs123', 'mahasiswa', 'Peserta Magang Marketing & PR', false),
('a3333333-3333-3333-3333-333333333334', 'Budi Santoso', 'budi.santoso@students.uii.ac.id', 'pbkdf2_sha256$mhs123', 'mahasiswa', 'Peserta Magang Accounting & Finance', false),
('a3333333-3333-3333-3333-333333333335', 'Dika Pratama', 'dika.pratama@ity.ac.id', 'pbkdf2_sha256$mhs123', 'mahasiswa', 'Peserta Magang IT / Infrastructure', false)
ON CONFLICT (email) DO UPDATE SET
  nama = EXCLUDED.nama,
  jabatan = EXCLUDED.jabatan,
  kuasa_penuh = EXCLUDED.kuasa_penuh;

-- 2. SEED PERIODE PKL
INSERT INTO public.periode_pkl (id, nama_periode, tanggal_mulai, tanggal_selesai, status)
VALUES
('c1111111-1111-1111-1111-111111111111', 'Periode 1 - 2025', '2025-01-01', '2025-06-30', 'Aktif'),
('c2222222-2222-2222-2222-222222222222', 'Periode 2 - 2025', '2025-07-01', '2025-12-31', 'Nonaktif'),
('c3333333-3333-3333-3333-333333333333', 'Periode 1 - 2024', '2024-01-01', '2024-06-30', 'Nonaktif')
ON CONFLICT (nama_periode) DO UPDATE SET
  status = EXCLUDED.status;

-- 3. SEED 3 KRITERIA BENEFIT SMART PT SEVEN INC.
INSERT INTO public.kriteria_smart (id, kode, nama, tipe, bobot_awal, bobot_normal, deskripsi, urutan, aktif)
VALUES
('b1111111-1111-1111-1111-111111111111', 'C1', 'Kehadiran', 'benefit', 30.00, 0.3000, 'Tingkat presensi dan kedisiplinan partisipasi kerja selama periode PKL di PT Seven Inc. (Skala 0-100)', 1, true),
('b2222222-2222-2222-2222-222222222222', 'C2', 'Ketepatan Waktu', 'benefit', 20.00, 0.2000, 'Kepatuhan mahasiswa terhadap jam masuk kerja dan tata tertib operasional kantor (Skala 0-100)', 2, true),
('b3333333-3333-3333-3333-333333333333', 'C3', 'Penyelesaian Tugas', 'benefit', 50.00, 0.5000, 'Kemampuan, kualitas hasil, dan kecepatan dalam menuntaskan proyek tugas kerja magang (Skala 0-100)', 3, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  bobot_awal = EXCLUDED.bobot_awal,
  bobot_normal = EXCLUDED.bobot_normal,
  deskripsi = EXCLUDED.deskripsi;

-- 4. SEED MAHASISWA PKL (DENGAN EMAIL MAHASISWA SEBAGAI IDENTITAS UTAMA)
INSERT INTO public.mahasiswa_pkl (
  id, kode_alternatif, nama, email, nim, institusi, bagian, periode,
  tanggal_mulai, tanggal_selesai, no_hp, status, skor_akhir_smart, nilai_skala_100, peringkat, keterangan_nilai
) VALUES
(
  'm1111111-1111-1111-1111-111111111111', 'A1', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id', '20241001',
  'Universitas Gadjah Mada', 'IT / Software Engineering', 'Periode 1 - 2025',
  '2025-01-01', '2025-06-30', '0812-3456-7801', 'Aktif', 0.9250, 92.50, 1, 'Sangat Baik'
),
(
  'm2222222-2222-2222-2222-222222222222', 'A2', 'Rina Anggraini', 'rina.anggraini@student.uny.ac.id', '20241004',
  'Universitas Negeri Yogyakarta', 'HRD & Talent Development', 'Periode 1 - 2025',
  '2025-01-01', '2025-06-30', '0812-3456-7802', 'Aktif', 0.8900, 89.00, 2, 'Baik'
),
(
  'm3333333-3333-3333-3333-333333333333', 'A3', 'Siti Nurhaliza', 'siti.nurhaliza@upnyk.ac.id', '20241002',
  'Universitas Pembangunan Nasional', 'Marketing & PR', 'Periode 1 - 2025',
  '2025-01-01', '2025-06-30', '0812-3456-7803', 'Aktif', 0.8850, 88.50, 3, 'Baik'
),
(
  'm4444444-4444-4444-4444-444444444444', 'A4', 'Budi Santoso', 'budi.santoso@students.uii.ac.id', '20241003',
  'Universitas Islam Indonesia', 'Accounting & Finance', 'Periode 1 - 2025',
  '2025-01-01', '2025-06-30', '0812-3456-7804', 'Aktif', 0.7850, 78.50, 4, 'Cukup'
),
(
  'm5555555-5555-5555-5555-555555555555', 'A5', 'Dika Pratama', 'dika.pratama@ity.ac.id', '20241005',
  'Institut Teknologi Yogyakarta', 'IT / Infrastructure', 'Periode 1 - 2025',
  '2025-01-01', '2025-06-30', '0812-3456-7805', 'Aktif', 0.7350, 73.50, 5, 'Cukup'
)
ON CONFLICT (email) DO UPDATE SET
  nama = EXCLUDED.nama,
  bagian = EXCLUDED.bagian,
  institusi = EXCLUDED.institusi,
  skor_akhir_smart = EXCLUDED.skor_akhir_smart,
  nilai_skala_100 = EXCLUDED.nilai_skala_100,
  peringkat = EXCLUDED.peringkat,
  keterangan_nilai = EXCLUDED.keterangan_nilai;

-- 5. SEED MATRIKS PENILAIAN MAHASISWA (C1, C2, C3)
-- Formula SMART:
-- A1: C1=95 (u=0.95, w*u=0.285), C2=90 (u=0.90, w*u=0.180), C3=92 (u=0.92, w*u=0.460) -> Total = 0.9250
-- A2: C1=95 (u=0.95, w*u=0.285), C2=90 (u=0.90, w*u=0.180), C3=85 (u=0.85, w*u=0.425) -> Total = 0.8900
-- A3: C1=90 (u=0.90, w*u=0.270), C2=95 (u=0.95, w*u=0.190), C3=85 (u=0.85, w*u=0.425) -> Total = 0.8850
-- A4: C1=80 (u=0.80, w*u=0.240), C2=85 (u=0.85, w*u=0.170), C3=75 (u=0.75, w*u=0.375) -> Total = 0.7850
-- A5: C1=75 (u=0.75, w*u=0.225), C2=80 (u=0.80, w*u=0.160), C3=70 (u=0.70, w*u=0.350) -> Total = 0.7350
INSERT INTO public.penilaian_mahasiswa (mahasiswa_id, kriteria_id, nilai_mentah, nilai_utilitas, kontribusi)
VALUES
-- Andi Pratama (A1)
('m1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 95.00, 0.9500, 0.2850),
('m1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 90.00, 0.9000, 0.1800),
('m1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 92.00, 0.9200, 0.4600),

-- Rina Anggraini (A2)
('m2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 95.00, 0.9500, 0.2850),
('m2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 90.00, 0.9000, 0.1800),
('m2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 85.00, 0.8500, 0.4250),

-- Siti Nurhaliza (A3)
('m3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 90.00, 0.9000, 0.2700),
('m3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 95.00, 0.9500, 0.1900),
('m3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 85.00, 0.8500, 0.4250),

-- Budi Santoso (A4)
('m4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 80.00, 0.8000, 0.2400),
('m4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 85.00, 0.8500, 0.1700),
('m4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 75.00, 0.7500, 0.3750),

-- Dika Pratama (A5)
('m5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 75.00, 0.7500, 0.2250),
('m5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 80.00, 0.8000, 0.1600),
('m5555555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 70.00, 0.7000, 0.3500)
ON CONFLICT (mahasiswa_id, kriteria_id) DO UPDATE SET
  nilai_mentah = EXCLUDED.nilai_mentah,
  nilai_utilitas = EXCLUDED.nilai_utilitas,
  kontribusi = EXCLUDED.kontribusi;

-- 6. SEED AUDIT LOGS (RIWAYAT PENGAWASAN FOUNDER)
INSERT INTO public.audit_logs (id, aktor, role, aksi, rincian, waktu)
VALUES
('l1111111-1111-1111-1111-111111111111', 'Siti Rahma, S.Psi. (HRD)', 'admin', 'Input Penilaian Mahasiswa', 'Memperbarui skor kedisiplinan dan kinerja C1, C2, C3 untuk 5 mahasiswa Periode 1 - 2025.', NOW() - INTERVAL '3 days'),
('l2222222-2222-2222-2222-222222222222', 'Bpk. H. Rekso (Founder & CEO)', 'super_admin', 'Pengesahan Peringkat SMART', 'Mengesahkan penetapan Peringkat 1 untuk Andi Pratama (andi.pratama@mail.ugm.ac.id) dengan skor akhir SMART 0.9250.', NOW() - INTERVAL '2 days'),
('l3333333-3333-3333-3333-333333333333', 'Siti Rahma, S.Psi. (HRD)', 'admin', 'Ekspor Data Mahasiswa', 'Mengekspor rekapitulasi nilai dan perangkingan mahasiswa PKL dalam format CSV dan JSON.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 7. SEED PENGESAHAN SK JUARA PKL
INSERT INTO public.pengesahan_sk_juara (id, nomor_sk, periode, mahasiswa_id, nama_pemenang, email_pemenang, skor_smart, nilai_skala_100, predikat, disahkan_oleh)
VALUES
(
  's1111111-1111-1111-1111-111111111111', 'SK/7INC/PKL-SMART/2025/001', 'Periode 1 - 2025',
  'm1111111-1111-1111-1111-111111111111', 'Andi Pratama', 'andi.pratama@mail.ugm.ac.id',
  0.9250, 92.50, 'Sangat Baik', 'Bpk. H. Rekso (Founder & CEO)'
)
ON CONFLICT (nomor_sk) DO NOTHING;

-- 8. SEED SITE SETTINGS
INSERT INTO public.site_settings (key, value, tipe)
VALUES
('nama_situs', 'SMART PKL', 'text'),
('tagline', 'Sistem Penunjang Keputusan Penilaian Kedisiplinan & Kinerja Mahasiswa PKL', 'text'),
('nama_perusahaan_host', 'PT Seven Inc.', 'text'),
('deskripsi_singkat', 'Platform evaluasi kinerja mahasiswa PKL berbasis metode SMART dengan 3 Kriteria Benefit objektif dan transparan.', 'text'),
('email_kontak', 'pkl-support@seveninc.co.id', 'text'),
('telepon_kontak', '+62 821-3456-7890', 'text'),
('alamat_kontak', 'Jl. Ringroad Utara No. 7, Sleman, D.I. Yogyakarta', 'text'),
('teks_footer', '© 2026 PT Seven Inc. Hak cipta dilindungi undang-undang. Bersama membangun generasi profesional yang disiplin dan kompeten.', 'text'),
('quote_login', 'Disiplin hari ini, kesuksesan esok hari.', 'text')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
