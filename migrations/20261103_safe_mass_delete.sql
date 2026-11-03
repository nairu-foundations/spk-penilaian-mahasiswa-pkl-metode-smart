-- Explicit predicates satisfy Supabase safe-update protection.
BEGIN;
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

NOTIFY pgrst, 'reload schema';
COMMIT;
