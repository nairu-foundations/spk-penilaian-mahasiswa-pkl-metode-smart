-- Monthly attendance and four-task evidence are visible only to admins or the student.
BEGIN;
ALTER TABLE public.mahasiswa_pkl ADD COLUMN IF NOT EXISTS rekap_bulanan jsonb;
CREATE OR REPLACE VIEW public.mahasiswa_pkl_app WITH (security_barrier = true) AS
SELECT id,kode_alternatif,nama,email,nim,institusi,bagian,periode,status,
 nilai_kriteria,utility,skor_akhir_smart,nilai_skala_100,peringkat,keterangan_nilai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN no_hp ELSE '' END AS no_hp,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN tanggal_mulai ELSE NULL END AS tanggal_mulai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN tanggal_selesai ELSE NULL END AS tanggal_selesai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN pembimbing_industri ELSE '' END AS pembimbing_industri,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN catatan_evaluasi ELSE '' END AS catatan_evaluasi,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN rekap_bulanan ELSE NULL END AS rekap_bulanan
FROM public.mahasiswa_pkl;
CREATE OR REPLACE FUNCTION public.save_mahasiswa_pkl_batch(p_rows JSONB, p_replace BOOLEAN DEFAULT false)
RETURNS SETOF public.mahasiswa_pkl
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  row_data public.mahasiswa_pkl;
  r jsonb; h integer; hadir integer; tepat integer; target integer; selesai integer; basis text;
BEGIN
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Data mahasiswa harus berupa array';
  END IF;
  -- Serialisasi impor dan penyimpanan agar pemeriksaan kode konsisten.
  LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;

  IF p_replace THEN
    DELETE FROM public.mahasiswa_pkl WHERE id NOT IN (
      SELECT (value ->> 'id')::uuid FROM jsonb_array_elements(p_rows)
    );
  END IF;
  FOR row_data IN SELECT * FROM jsonb_populate_recordset(NULL::public.mahasiswa_pkl, p_rows)
  LOOP
    IF row_data.rekap_bulanan IS NOT NULL THEN
      r := row_data.rekap_bulanan;
      h := (r->>'hari_kerja')::integer; hadir := (r->>'hari_hadir')::integer;
      tepat := (r->>'hari_tepat_waktu')::integer; target := (r->>'target_tugas')::integer;
      selesai := (r->>'tugas_selesai')::integer; basis := r->>'dasar_c2';
      IF jsonb_typeof(r) IS DISTINCT FROM 'object' OR h IS NULL OR hadir IS NULL OR tepat IS NULL OR target IS NULL OR selesai IS NULL OR basis IS NULL
        OR h <= 0 OR hadir < 0 OR hadir > h OR tepat < 0 OR tepat > hadir OR target <> 4 OR selesai < 0 OR selesai > target
        OR basis NOT IN ('hari_kerja','hari_hadir') THEN RAISE EXCEPTION 'Rekap bulanan tidak valid'; END IF;
      row_data.nilai_kriteria := coalesce(row_data.nilai_kriteria, '{}'::jsonb) || jsonb_build_object(
        'C1', round(hadir*100.0/h,4),
        'C2', CASE WHEN basis='hari_hadir' THEN CASE WHEN hadir=0 THEN 0 ELSE round(tepat*100.0/hadir,4) END ELSE round(tepat*100.0/h,4) END,
        'C3', round(selesai*100.0/target,4));
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_each_text(row_data.nilai_kriteria) AS n WHERE n.value::numeric < 0 OR n.value::numeric > 100) THEN
      RAISE EXCEPTION 'Nilai mahasiswa harus antara 0 dan 100';
    END IF;
    INSERT INTO public.mahasiswa_pkl (
      id, kode_alternatif, nama, email, nim, institusi, bagian, periode,
      tanggal_mulai, tanggal_selesai, no_hp, status, nilai_kriteria, utility,
      skor_akhir_smart, nilai_skala_100, peringkat, keterangan_nilai,
      pembimbing_industri, catatan_evaluasi, rekap_bulanan
    ) VALUES (
      row_data.id, row_data.kode_alternatif, row_data.nama, row_data.email,
      row_data.nim, row_data.institusi, row_data.bagian, row_data.periode,
      row_data.tanggal_mulai, row_data.tanggal_selesai, row_data.no_hp, row_data.status,
      row_data.nilai_kriteria, row_data.utility, row_data.skor_akhir_smart,
      row_data.nilai_skala_100, row_data.peringkat, row_data.keterangan_nilai,
      row_data.pembimbing_industri, row_data.catatan_evaluasi, row_data.rekap_bulanan
    ) ON CONFLICT (id) DO UPDATE SET
      nama = EXCLUDED.nama, email = EXCLUDED.email, nim = EXCLUDED.nim,
      institusi = EXCLUDED.institusi, bagian = EXCLUDED.bagian, periode = EXCLUDED.periode,
      tanggal_mulai = EXCLUDED.tanggal_mulai, tanggal_selesai = EXCLUDED.tanggal_selesai,
      no_hp = EXCLUDED.no_hp, status = EXCLUDED.status,
      nilai_kriteria = EXCLUDED.nilai_kriteria, utility = EXCLUDED.utility,
      skor_akhir_smart = EXCLUDED.skor_akhir_smart, nilai_skala_100 = EXCLUDED.nilai_skala_100,
      peringkat = EXCLUDED.peringkat, keterangan_nilai = EXCLUDED.keterangan_nilai,
      pembimbing_industri = EXCLUDED.pembimbing_industri,
      catatan_evaluasi = EXCLUDED.catatan_evaluasi, rekap_bulanan = EXCLUDED.rekap_bulanan, updated_at = NOW();

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
NOTIFY pgrst, 'reload schema';
COMMIT;
