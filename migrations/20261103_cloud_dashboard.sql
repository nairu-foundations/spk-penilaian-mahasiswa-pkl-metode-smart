-- Production persistence, Supabase Auth profiles and role-based database access.
-- Apply after 20261103_shared_mahasiswa.sql. Never grants anonymous writes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.app_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  nama text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('super_admin','admin','mahasiswa')),
  jabatan text NOT NULL DEFAULT 'Peserta PKL',
  nim text, no_hp text, prodi text, angkatan text, avatar_url text,
  kuasa_penuh boolean GENERATED ALWAYS AS (role = 'super_admin') STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_app_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'));
$$;
CREATE OR REPLACE FUNCTION public.is_app_founder() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;
CREATE OR REPLACE FUNCTION public.create_app_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.app_profiles (id,email,nama)
  VALUES (NEW.id,NEW.email,coalesce(NEW.raw_user_meta_data->>'nama',split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS create_app_profile ON auth.users;
CREATE TRIGGER create_app_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_app_profile();
INSERT INTO public.app_profiles (id,email,nama)
SELECT id,email,coalesce(raw_user_meta_data->>'nama',split_part(email,'@',1)) FROM auth.users
WHERE email IS NOT NULL ON CONFLICT (id) DO NOTHING;

REVOKE ALL ON public.app_profiles FROM anon,authenticated;
GRANT SELECT ON public.app_profiles TO authenticated;
GRANT UPDATE (nama,no_hp,prodi,angkatan,nim,avatar_url) ON public.app_profiles TO authenticated;
DROP POLICY IF EXISTS app_profiles_read ON public.app_profiles;
CREATE POLICY app_profiles_read ON public.app_profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()) OR public.is_app_admin());
DROP POLICY IF EXISTS app_profiles_update ON public.app_profiles;
CREATE POLICY app_profiles_update ON public.app_profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.alternatif (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kode text NOT NULL UNIQUE,
 nama_perusahaan text NOT NULL, bidang text NOT NULL DEFAULT '', alamat text NOT NULL DEFAULT '',
 kota text NOT NULL DEFAULT '', kuota integer NOT NULL DEFAULT 0, kuota_terisi integer DEFAULT 0,
 deskripsi text NOT NULL DEFAULT '', logo_url text, kontak text NOT NULL DEFAULT '',
 email text, website text, aktif boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.skala_nilai (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kriteria_id uuid REFERENCES public.kriteria_smart(id) ON DELETE CASCADE,
 nilai numeric NOT NULL, keterangan text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.nilai_alternatif (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), alternatif_id uuid NOT NULL REFERENCES public.alternatif(id) ON DELETE CASCADE,
 kriteria_id uuid NOT NULL REFERENCES public.kriteria_smart(id) ON DELETE CASCADE,
 nilai numeric NOT NULL, UNIQUE(alternatif_id,kriteria_id)
);
CREATE TABLE IF NOT EXISTS public.pengajuan_pkl (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.app_profiles(id),
 alternatif_id uuid NOT NULL REFERENCES public.alternatif(id), periode_id uuid REFERENCES public.periode_pkl(id),
 status text NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan','disetujui','ditolak')),
 catatan_admin text DEFAULT '', skor_smart numeric, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pengajuan ON public.pengajuan_pkl(user_id) WHERE status <> 'ditolak';
CREATE TABLE IF NOT EXISTS public.hasil_perhitungan (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 bobot_snapshot jsonb NOT NULL DEFAULT '{}', ranking jsonb NOT NULL DEFAULT '[]',
 catatan text DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hasil_perhitungan ADD COLUMN IF NOT EXISTS ranking jsonb NOT NULL DEFAULT '[]';

-- Replace legacy demo policies only on the tables now managed by this application.
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['mahasiswa_pkl','kriteria_smart','penilaian_mahasiswa','periode_pkl','site_settings','alternatif','skala_nilai','nilai_alternatif','pengajuan_pkl','hasil_perhitungan','audit_logs','pengesahan_sk_juara'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
    EXECUTE format('CREATE POLICY app_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin())',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['kriteria_smart','periode_pkl','site_settings','alternatif','skala_nilai','nilai_alternatif'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon',t);
    EXECUTE format('CREATE POLICY app_public_read ON public.%I FOR SELECT TO anon,authenticated USING (true)',t);
  END LOOP;
END;
$$;

-- Public ranking data is projected separately from private contact details.
-- The definer-owned view is intentional: CASE expressions redact private columns.
CREATE OR REPLACE VIEW public.mahasiswa_pkl_app WITH (security_barrier = true) AS
SELECT id,kode_alternatif,nama,email,nim,institusi,bagian,periode,status,
 nilai_kriteria,utility,skor_akhir_smart,nilai_skala_100,peringkat,keterangan_nilai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN no_hp ELSE '' END AS no_hp,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN tanggal_mulai ELSE NULL END AS tanggal_mulai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN tanggal_selesai ELSE NULL END AS tanggal_selesai,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN pembimbing_industri ELSE '' END AS pembimbing_industri,
 CASE WHEN public.is_app_admin() OR email = auth.jwt()->>'email' THEN catatan_evaluasi ELSE '' END AS catatan_evaluasi
FROM public.mahasiswa_pkl;
REVOKE ALL ON public.mahasiswa_pkl_app FROM PUBLIC;
GRANT SELECT ON public.mahasiswa_pkl_app TO anon,authenticated;

CREATE POLICY app_own_pengajuan_read ON public.pengajuan_pkl FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY app_own_pengajuan_insert ON public.pengajuan_pkl FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND status='diajukan' AND coalesce(catatan_admin,'')='');
CREATE POLICY app_own_hasil ON public.hasil_perhitungan FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Audit entries for mutations commit or roll back with their parent transaction.
CREATE OR REPLACE FUNCTION public.app_audit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor public.app_profiles; payload jsonb;
BEGIN
  SELECT * INTO actor FROM public.app_profiles WHERE id=auth.uid();
  payload := CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  INSERT INTO public.audit_logs (aktor,role,aksi,rincian)
  VALUES (coalesce(actor.nama,'Database migration'),coalesce(actor.role,'super_admin')::public.role_aktor_type,
    TG_OP || ' ' || TG_TABLE_NAME, jsonb_build_object('id',coalesce(payload->>'id',payload->>'key'),'operation',TG_OP)::text);
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['mahasiswa_pkl','kriteria_smart','periode_pkl','site_settings','pengajuan_pkl','alternatif','hasil_perhitungan','pengesahan_sk_juara','app_profiles'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS app_audit_change ON public.%I',t);
    EXECUTE format('CREATE TRIGGER app_audit_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.app_audit_change()',t);
  END LOOP;
END; $$;
-- Logs are append-only through trusted trigger/functions; clients cannot rewrite history.
REVOKE INSERT,UPDATE,DELETE ON public.audit_logs FROM authenticated;

CREATE OR REPLACE FUNCTION public.record_app_audit(p_aksi text,p_rincian text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor public.app_profiles;
BEGIN
 IF NOT public.is_app_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan'; END IF;
 SELECT * INTO actor FROM public.app_profiles WHERE id=auth.uid();
 INSERT INTO public.audit_logs (aktor,role,aksi,rincian) VALUES (actor.nama,actor.role::public.role_aktor_type,p_aksi,p_rincian);
END;
$$;

CREATE OR REPLACE FUNCTION public.certify_smart_ranking(p_periode text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE winner record; actor public.app_profiles;
BEGIN
 IF NOT public.is_app_founder() THEN RAISE EXCEPTION 'Hanya Founder dapat mengesahkan hasil'; END IF;
 SELECT * INTO actor FROM public.app_profiles WHERE id=auth.uid();
 SELECT m.*, scores.score INTO winner FROM public.mahasiswa_pkl m
 CROSS JOIN LATERAL (
   SELECT round(sum((CASE WHEN k.tipe='benefit' THEN (m.nilai_kriteria->>k.kode)::numeric ELSE 100-(m.nilai_kriteria->>k.kode)::numeric END)/100
     * round(k.bobot_awal/nullif((SELECT sum(bobot_awal) FROM public.kriteria_smart WHERE aktif),0),4)),4) AS score
   FROM public.kriteria_smart k WHERE k.aktif AND m.nilai_kriteria ? k.kode
 ) scores
 WHERE m.periode=p_periode AND scores.score IS NOT NULL ORDER BY scores.score DESC,m.kode_alternatif LIMIT 1;
 IF winner.id IS NULL THEN RAISE EXCEPTION 'Tidak ada mahasiswa yang sudah dinilai pada periode ini'; END IF;
 INSERT INTO public.pengesahan_sk_juara (nomor_sk,periode,mahasiswa_id,nama_pemenang,email_pemenang,skor_smart,nilai_skala_100,predikat,disahkan_oleh)
 VALUES ('SK-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSUS'),p_periode,winner.id,winner.nama,winner.email,winner.score,winner.score*100,
   CASE WHEN winner.score>=0.90 THEN 'Sangat Baik' WHEN winner.score>=0.80 THEN 'Baik' WHEN winner.score>=0.70 THEN 'Cukup' ELSE 'Kurang' END,actor.nama);
END;
$$;
REVOKE ALL ON FUNCTION public.record_app_audit(text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.certify_smart_ranking(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_mahasiswa_pkl_batch(jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_app_audit(text,text),public.certify_smart_ranking(text),public.save_mahasiswa_pkl_batch(jsonb,boolean) TO authenticated;

-- Public image buckets: reads are public, writes require a verified admin session.
INSERT INTO storage.buckets (id,name,public) VALUES ('konten','konten',true),('alternatif','alternatif',true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS app_image_read ON storage.objects;
CREATE POLICY app_image_read ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id IN ('konten','alternatif'));
DROP POLICY IF EXISTS app_image_write ON storage.objects;
CREATE POLICY app_image_write ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('konten','alternatif') AND public.is_app_admin())
WITH CHECK (bucket_id IN ('konten','alternatif') AND public.is_app_admin());

-- Close legacy demo write paths that are not used by the cloud application.
REVOKE INSERT,UPDATE,DELETE ON public.kriteria FROM anon,authenticated;
ALTER TABLE public.pengguna_aktor ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pengguna_aktor FROM anon,authenticated;

-- Persist derived SMART scores and ranks, including changes to criteria weights.
CREATE OR REPLACE FUNCTION public.recalculate_app_smart() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.kriteria_smart k SET bobot_normal=coalesce(round(k.bobot_awal/nullif((SELECT sum(bobot_awal) FROM public.kriteria_smart WHERE aktif),0),4),0)
  WHERE k.bobot_normal IS DISTINCT FROM coalesce(round(k.bobot_awal/nullif((SELECT sum(bobot_awal) FROM public.kriteria_smart WHERE aktif),0),4),0);
  WITH scores AS (
    SELECT m.id,
      coalesce(jsonb_object_agg(k.kode, CASE WHEN k.tipe='benefit' THEN coalesce((m.nilai_kriteria->>k.kode)::numeric,0)/100 ELSE (100-coalesce((m.nilai_kriteria->>k.kode)::numeric,0))/100 END) FILTER (WHERE k.id IS NOT NULL),'{}') AS utility,
      coalesce(round(sum((CASE WHEN k.tipe='benefit' THEN coalesce((m.nilai_kriteria->>k.kode)::numeric,0)/100 ELSE (100-coalesce((m.nilai_kriteria->>k.kode)::numeric,0))/100 END)*k.bobot_normal),4),0) AS score
    FROM public.mahasiswa_pkl m LEFT JOIN public.kriteria_smart k ON k.aktif GROUP BY m.id
  ), ranked AS (
    SELECT s.*, row_number() OVER (ORDER BY s.score DESC,m.kode_alternatif) AS rank FROM scores s JOIN public.mahasiswa_pkl m ON m.id=s.id
  )
  UPDATE public.mahasiswa_pkl m SET utility=r.utility,skor_akhir_smart=r.score,nilai_skala_100=round(r.score*100,2),peringkat=r.rank,
    keterangan_nilai=CASE WHEN r.score>=0.90 THEN 'Sangat Baik' WHEN r.score>=0.80 THEN 'Baik' WHEN r.score>=0.70 THEN 'Cukup' ELSE 'Kurang' END
  FROM ranked r WHERE m.id=r.id AND (m.utility,m.skor_akhir_smart,m.nilai_skala_100,m.peringkat) IS DISTINCT FROM (r.utility,r.score,round(r.score*100,2),r.rank);
END;
$$;
REVOKE ALL ON FUNCTION public.recalculate_app_smart() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.trigger_recalculate_app_smart() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN PERFORM public.recalculate_app_smart(); RETURN NULL; END;
$$;
DROP TRIGGER IF EXISTS recalculate_student_smart ON public.mahasiswa_pkl;
CREATE TRIGGER recalculate_student_smart AFTER INSERT OR DELETE OR UPDATE OF nilai_kriteria,kode_alternatif ON public.mahasiswa_pkl
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_recalculate_app_smart();
DROP TRIGGER IF EXISTS recalculate_criteria_smart ON public.kriteria_smart;
CREATE TRIGGER recalculate_criteria_smart AFTER INSERT OR DELETE OR UPDATE OF bobot_awal,tipe,aktif ON public.kriteria_smart
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_recalculate_app_smart();
SELECT public.recalculate_app_smart();

NOTIFY pgrst, 'reload schema';
COMMIT;
