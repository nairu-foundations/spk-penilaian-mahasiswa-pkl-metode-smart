-- Jalankan sekali pada SQL Editor proyek Supabase yang dipakai aplikasi.
-- Jalankan schema.sql terlebih dahulu jika tabel mahasiswa_pkl belum tersedia.
-- Tidak mengubah RLS atau memberi akses tulis publik tambahan.
BEGIN;

-- Kriteria awal untuk database baru; kriteria yang sudah ada tidak ditimpa.
INSERT INTO public.kriteria_smart (kode, nama, tipe, bobot_awal, bobot_normal, urutan)
VALUES ('C1', 'Kehadiran', 'benefit', 30, 0.3, 1),
       ('C2', 'Ketepatan Waktu', 'benefit', 20, 0.2, 2),
       ('C3', 'Penyelesaian Tugas', 'benefit', 50, 0.5, 3)
ON CONFLICT (kode) DO NOTHING;

ALTER TABLE public.mahasiswa_pkl
  ADD COLUMN IF NOT EXISTS nilai_kriteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS utility JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pembimbing_industri TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS catatan_evaluasi TEXT NOT NULL DEFAULT '';

-- Salin nilai yang sudah ada pada tabel penilaian, tanpa menimpa nilai baru.
UPDATE public.mahasiswa_pkl AS m
SET nilai_kriteria = COALESCE((
  SELECT jsonb_object_agg(k.kode, p.nilai_mentah)
  FROM public.penilaian_mahasiswa p
  JOIN public.kriteria_smart k ON k.id = p.kriteria_id
  WHERE p.mahasiswa_id = m.id
), '{}'::jsonb)
WHERE m.nilai_kriteria = '{}'::jsonb;

-- SECURITY INVOKER: tetap mengikuti hak akses dan RLS pemanggil.
-- Satu transaksi untuk impor, sehingga impor gagal tidak menghapus data lama.
CREATE OR REPLACE FUNCTION public.save_mahasiswa_pkl_batch(p_rows JSONB, p_replace BOOLEAN DEFAULT false)
RETURNS SETOF public.mahasiswa_pkl
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  row_data public.mahasiswa_pkl;
BEGIN
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Data mahasiswa harus berupa array';
  END IF;
  -- Serialisasi impor dan penyimpanan agar pemeriksaan kode konsisten.
  LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;

  FOR row_data IN SELECT * FROM jsonb_populate_recordset(NULL::public.mahasiswa_pkl, p_rows)
  LOOP
    IF EXISTS (SELECT 1 FROM jsonb_each_text(row_data.nilai_kriteria) AS n WHERE n.value::numeric < 0 OR n.value::numeric > 100) THEN
      RAISE EXCEPTION 'Nilai mahasiswa harus antara 0 dan 100';
    END IF;
    INSERT INTO public.mahasiswa_pkl (
      id, kode_alternatif, nama, email, nim, institusi, bagian, periode,
      tanggal_mulai, tanggal_selesai, no_hp, status, nilai_kriteria, utility,
      skor_akhir_smart, nilai_skala_100, peringkat, keterangan_nilai,
      pembimbing_industri, catatan_evaluasi
    ) VALUES (
      row_data.id, row_data.kode_alternatif, row_data.nama, row_data.email,
      row_data.nim, row_data.institusi, row_data.bagian, row_data.periode,
      row_data.tanggal_mulai, row_data.tanggal_selesai, row_data.no_hp, row_data.status,
      row_data.nilai_kriteria, row_data.utility, row_data.skor_akhir_smart,
      row_data.nilai_skala_100, row_data.peringkat, row_data.keterangan_nilai,
      row_data.pembimbing_industri, row_data.catatan_evaluasi
    ) ON CONFLICT (id) DO UPDATE SET
      nama = EXCLUDED.nama, email = EXCLUDED.email, nim = EXCLUDED.nim,
      institusi = EXCLUDED.institusi, bagian = EXCLUDED.bagian, periode = EXCLUDED.periode,
      tanggal_mulai = EXCLUDED.tanggal_mulai, tanggal_selesai = EXCLUDED.tanggal_selesai,
      no_hp = EXCLUDED.no_hp, status = EXCLUDED.status,
      nilai_kriteria = EXCLUDED.nilai_kriteria, utility = EXCLUDED.utility,
      skor_akhir_smart = EXCLUDED.skor_akhir_smart, nilai_skala_100 = EXCLUDED.nilai_skala_100,
      peringkat = EXCLUDED.peringkat, keterangan_nilai = EXCLUDED.keterangan_nilai,
      pembimbing_industri = EXCLUDED.pembimbing_industri,
      catatan_evaluasi = EXCLUDED.catatan_evaluasi, updated_at = NOW();

    -- Pertahankan kompatibilitas view rekap SQL dengan nilai yang disimpan aplikasi.
    INSERT INTO public.penilaian_mahasiswa (mahasiswa_id, kriteria_id, nilai_mentah)
    SELECT row_data.id, k.id, (row_data.nilai_kriteria ->> k.kode)::numeric
    FROM public.kriteria_smart k WHERE row_data.nilai_kriteria ? k.kode
    ON CONFLICT (mahasiswa_id, kriteria_id) DO UPDATE
      SET nilai_mentah = EXCLUDED.nilai_mentah, updated_at = NOW();
    DELETE FROM public.penilaian_mahasiswa p USING public.kriteria_smart k
    WHERE p.mahasiswa_id = row_data.id AND p.kriteria_id = k.id
      AND NOT (row_data.nilai_kriteria ? k.kode);
  END LOOP;

  IF p_replace THEN
    DELETE FROM public.mahasiswa_pkl WHERE id NOT IN (
      SELECT (value ->> 'id')::uuid FROM jsonb_array_elements(p_rows)
    );
    -- RLS dapat menyembunyikan baris dari DELETE. Jangan laporkan impor pengganti berhasil.
    IF EXISTS (SELECT 1 FROM public.mahasiswa_pkl WHERE id NOT IN (
      SELECT (value ->> 'id')::uuid FROM jsonb_array_elements(p_rows)
    )) THEN RAISE EXCEPTION 'Tidak diizinkan mengganti seluruh data mahasiswa'; END IF;
  END IF;
  RETURN QUERY SELECT * FROM public.mahasiswa_pkl WHERE id IN (
    SELECT (value ->> 'id')::uuid FROM jsonb_array_elements(p_rows)
  );
END;
$$;

COMMIT;
