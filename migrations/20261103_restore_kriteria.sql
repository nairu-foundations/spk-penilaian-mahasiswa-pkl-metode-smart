-- Jalankan di SQL Editor Supabase sebagai pemilik database.
-- Pulihkan kriteria standar agar perhitungan SMART dapat berjalan.
BEGIN;

INSERT INTO public.kriteria_smart
  (kode, nama, tipe, bobot_awal, bobot_normal, urutan, aktif)
VALUES
  ('C1', 'Kehadiran', 'benefit', 30, 0.30, 1, true),
  ('C2', 'Ketepatan Waktu', 'benefit', 20, 0.20, 2, true),
  ('C3', 'Penyelesaian Tugas', 'benefit', 50, 0.50, 3, true)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama, tipe = EXCLUDED.tipe,
  bobot_awal = EXCLUDED.bobot_awal, bobot_normal = EXCLUDED.bobot_normal,
  urutan = EXCLUDED.urutan, aktif = true;

-- Bobot digunakan halaman peringkat publik. Hanya tambahkan hak BACA.
-- Tidak memberi izin INSERT/UPDATE/DELETE ke pengguna anonim.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'kriteria_smart' AND policyname = 'kriteria_smart_public_read'
  ) THEN
    CREATE POLICY kriteria_smart_public_read ON public.kriteria_smart
      FOR SELECT TO anon, authenticated USING (true);
  END IF;
END;
$$;

COMMIT;

SELECT kode, nama, bobot_awal, aktif
FROM public.kriteria_smart ORDER BY urutan;
