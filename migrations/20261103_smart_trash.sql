-- Versioned recycle bin. Installation does not delete application data.
BEGIN;
CREATE TABLE IF NOT EXISTS public.smart_trash (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('dataset','history','student')),
 label text NOT NULL,
 deleted_at timestamptz NOT NULL DEFAULT now(),
 deleted_by uuid NOT NULL REFERENCES auth.users(id),
 restored_at timestamptz,
 restored_by uuid REFERENCES auth.users(id),
 student_count integer NOT NULL,
 history_count integer NOT NULL,
 snapshot jsonb NOT NULL
);
ALTER TABLE public.smart_trash ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS smart_trash_admin ON public.smart_trash;
CREATE POLICY smart_trash_admin ON public.smart_trash FOR ALL TO authenticated
 USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.smart_trash TO authenticated;
CREATE INDEX IF NOT EXISTS smart_trash_active ON public.smart_trash(deleted_at DESC) WHERE restored_at IS NULL;
DROP TRIGGER IF EXISTS app_audit_change ON public.smart_trash;
CREATE TRIGGER app_audit_change AFTER INSERT OR UPDATE OR DELETE ON public.smart_trash
 FOR EACH ROW EXECUTE FUNCTION public.app_audit_change();

CREATE OR REPLACE FUNCTION public.capture_smart_trash(p_history_id uuid, p_student_id uuid, p_include_students boolean, p_kind text, p_label text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE students jsonb; scores jsonb; history jsonb; links jsonb; trash_id uuid;
BEGIN
 IF NOT public.is_app_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]') INTO students FROM public.mahasiswa_pkl m
 WHERE p_include_students AND (p_student_id IS NULL OR m.id = p_student_id);
 SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]') INTO scores FROM public.penilaian_mahasiswa s
 WHERE s.mahasiswa_id IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(students));
 SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]') INTO history FROM public.hasil_perhitungan h
 WHERE p_student_id IS NULL AND (p_history_id IS NULL OR h.id = p_history_id)
 AND left(coalesce(h.catatan,''),length('SMART_MAHASISWA_V1:'))='SMART_MAHASISWA_V1:';
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'mahasiswa_id',c.mahasiswa_id)), '[]') INTO links FROM public.pengesahan_sk_juara c
 WHERE c.mahasiswa_id IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(students));
 IF jsonb_array_length(students)=0 AND jsonb_array_length(history)=0 THEN RETURN NULL; END IF;
 INSERT INTO public.smart_trash(kind,label,deleted_by,student_count,history_count,snapshot)
 VALUES (p_kind,p_label,auth.uid(),jsonb_array_length(students),jsonb_array_length(history),
 jsonb_build_object('version',1,'students',students,'scores',scores,'history',history,'certificate_links',links)) RETURNING id INTO trash_id;
 RETURN trash_id;
END; $$;

CREATE OR REPLACE FUNCTION public.clear_mahasiswa_smart_data(p_history_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  removed_history integer;
  removed_students integer;
  removed_scores integer;
  trash_id uuid;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menghapus seluruh data SMART';
  END IF;
  LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.hasil_perhitungan IN SHARE ROW EXCLUSIVE MODE;
  IF p_history_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.hasil_perhitungan WHERE id = p_history_id
      AND left(coalesce(catatan, ''), length('SMART_MAHASISWA_V1:')) = 'SMART_MAHASISWA_V1:') THEN
      RAISE EXCEPTION 'Riwayat SMART tidak ditemukan';
    END IF;
    IF (SELECT count(*) FROM public.hasil_perhitungan WHERE left(coalesce(catatan, ''), length('SMART_MAHASISWA_V1:')) = 'SMART_MAHASISWA_V1:') > 1 THEN
      trash_id := public.capture_smart_trash(p_history_id, NULL, false, 'history', 'Riwayat perhitungan SMART');
      DELETE FROM public.hasil_perhitungan WHERE id = p_history_id;
      RETURN jsonb_build_object('history', 1, 'students', 0, 'scores', 0, 'cleared_all', false, 'trash_id', trash_id);
    END IF;
  END IF;
  trash_id := public.capture_smart_trash(NULL, NULL, true, 'dataset', 'Seluruh data SMART');
  SELECT count(*) INTO removed_scores FROM public.penilaian_mahasiswa;

  -- Historical signed certificates retain their snapshots; detach their optional FK.
  UPDATE public.pengesahan_sk_juara SET mahasiswa_id = NULL WHERE mahasiswa_id IS NOT NULL;
  DELETE FROM public.penilaian_mahasiswa WHERE id IS NOT NULL;
  DELETE FROM public.mahasiswa_pkl WHERE id IS NOT NULL;
  GET DIAGNOSTICS removed_students = ROW_COUNT;
  DELETE FROM public.hasil_perhitungan
    WHERE left(coalesce(catatan, ''), length('SMART_MAHASISWA_V1:')) = 'SMART_MAHASISWA_V1:';
  GET DIAGNOSTICS removed_history = ROW_COUNT;
  RETURN jsonb_build_object('history', removed_history, 'students', removed_students, 'scores', removed_scores, 'cleared_all', true, 'trash_id', trash_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trash_mahasiswa_pkl(p_student_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE trash_id uuid; student_name text;
BEGIN
 IF NOT public.is_app_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan'; END IF;
 LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;
 SELECT nama INTO student_name FROM public.mahasiswa_pkl WHERE id=p_student_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Mahasiswa tidak ditemukan'; END IF;
 trash_id := public.capture_smart_trash(NULL,p_student_id,true,'student','Mahasiswa: ' || student_name);
 UPDATE public.pengesahan_sk_juara SET mahasiswa_id=NULL WHERE mahasiswa_id=p_student_id;
 DELETE FROM public.mahasiswa_pkl WHERE id=p_student_id;
 RETURN trash_id;
END; $$;

CREATE OR REPLACE FUNCTION public.restore_smart_trash(p_trash_id uuid, p_history_only boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE item public.smart_trash; students jsonb; history jsonb;
BEGIN
 IF NOT public.is_app_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan'; END IF;
 LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;
 LOCK TABLE public.hasil_perhitungan IN SHARE ROW EXCLUSIVE MODE;
 SELECT * INTO item FROM public.smart_trash WHERE id=p_trash_id FOR UPDATE;
 IF NOT FOUND OR item.restored_at IS NOT NULL THEN RAISE EXCEPTION 'Data tidak ditemukan atau sudah dipulihkan'; END IF;
 IF item.snapshot->>'version' IS DISTINCT FROM '1' THEN RAISE EXCEPTION 'Versi arsip tidak didukung'; END IF;
 students := CASE WHEN p_history_only THEN '[]'::jsonb ELSE item.snapshot->'students' END;
 history := item.snapshot->'history';
 IF p_history_only AND jsonb_array_length(history)=0 THEN RAISE EXCEPTION 'Arsip ini tidak memiliki riwayat perhitungan'; END IF;
 IF NOT p_history_only AND item.kind='dataset' AND EXISTS(SELECT 1 FROM public.mahasiswa_pkl) THEN
   RAISE EXCEPTION 'Data mahasiswa aktif masih ada. Pindahkan data aktif ke Tempat Sampah terlebih dahulu, atau pulihkan riwayat saja.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.mahasiswa_pkl m JOIN jsonb_array_elements(students) s
 ON m.id=(s->>'id')::uuid OR lower(m.email)=lower(s->>'email') OR m.kode_alternatif=s->>'kode_alternatif') THEN
   RAISE EXCEPTION 'Identitas, email, atau kode mahasiswa bertabrakan dengan data aktif. Data aktif tidak ditimpa.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.hasil_perhitungan h JOIN jsonb_array_elements(history) s ON h.id=(s->>'id')::uuid) THEN
   RAISE EXCEPTION 'Riwayat tersebut sudah ada. Tidak ada data yang ditimpa.';
 END IF;
 INSERT INTO public.mahasiswa_pkl SELECT * FROM jsonb_populate_recordset(NULL::public.mahasiswa_pkl,students);
 IF NOT p_history_only THEN
   INSERT INTO public.penilaian_mahasiswa SELECT * FROM jsonb_populate_recordset(NULL::public.penilaian_mahasiswa,item.snapshot->'scores')
   ON CONFLICT(mahasiswa_id,kriteria_id) DO UPDATE SET nilai_mentah=excluded.nilai_mentah;
   UPDATE public.pengesahan_sk_juara c SET mahasiswa_id=(link->>'mahasiswa_id')::uuid
   FROM jsonb_array_elements(item.snapshot->'certificate_links') link
   WHERE c.id=(link->>'id')::uuid AND c.mahasiswa_id IS NULL;
 END IF;
 INSERT INTO public.hasil_perhitungan SELECT * FROM jsonb_populate_recordset(NULL::public.hasil_perhitungan,history);
 IF p_history_only AND jsonb_array_length(item.snapshot->'students')>0 THEN
   -- Keep the remaining student backup available for a subsequent full restore.
   UPDATE public.smart_trash SET snapshot=jsonb_set(snapshot,'{history}','[]'::jsonb),history_count=0 WHERE id=p_trash_id;
 ELSE
   UPDATE public.smart_trash SET restored_at=now(),restored_by=auth.uid() WHERE id=p_trash_id;
 END IF;
 RETURN jsonb_build_object('students',jsonb_array_length(students),'history',jsonb_array_length(history));
END; $$;

CREATE OR REPLACE FUNCTION public.purge_smart_trash(p_trash_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF NOT public.is_app_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan'; END IF;
 DELETE FROM public.smart_trash WHERE id=p_trash_id AND restored_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Data tempat sampah tidak ditemukan'; END IF;
 RETURN true;
END; $$;
CREATE OR REPLACE FUNCTION public.save_mahasiswa_pkl_batch(p_rows JSONB, p_replace BOOLEAN DEFAULT false)
RETURNS SETOF public.mahasiswa_pkl
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  row_data public.mahasiswa_pkl;
  removed_row record;
  r jsonb; h integer; hadir integer; tepat integer; target integer; selesai integer; basis text;
BEGIN
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Data mahasiswa harus berupa array';
  END IF;
  -- Serialisasi impor dan penyimpanan agar pemeriksaan kode konsisten.
  LOCK TABLE public.mahasiswa_pkl IN SHARE ROW EXCLUSIVE MODE;

  IF p_replace THEN
    FOR removed_row IN SELECT id,nama FROM public.mahasiswa_pkl WHERE id NOT IN (
      SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_rows)
    ) LOOP
      PERFORM public.capture_smart_trash(NULL,removed_row.id,true,'student','Diganti saat impor: ' || removed_row.nama);
    END LOOP;
    UPDATE public.pengesahan_sk_juara SET mahasiswa_id=NULL WHERE mahasiswa_id IN (
      SELECT id FROM public.mahasiswa_pkl WHERE id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_rows))
    );
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
    FOR removed_row IN SELECT id,nama FROM public.mahasiswa_pkl WHERE id NOT IN (
      SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_rows)
    ) LOOP
      PERFORM public.capture_smart_trash(NULL,removed_row.id,true,'student','Diganti saat impor: ' || removed_row.nama);
    END LOOP;
    UPDATE public.pengesahan_sk_juara SET mahasiswa_id=NULL WHERE mahasiswa_id IN (
      SELECT id FROM public.mahasiswa_pkl WHERE id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_rows))
    );
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
