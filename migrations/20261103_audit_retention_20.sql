-- Keep exactly the latest 20 active audit records. Overflow remains recoverable.
BEGIN;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS visible_since timestamptz;
UPDATE public.audit_logs SET visible_since=waktu WHERE visible_since IS NULL;
ALTER TABLE public.audit_logs ALTER COLUMN visible_since SET DEFAULT clock_timestamp();
ALTER TABLE public.audit_logs ALTER COLUMN visible_since SET NOT NULL;
CREATE TABLE IF NOT EXISTS public.audit_log_trash (
 id uuid PRIMARY KEY,
 archived_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 archived_by uuid,
 reason text NOT NULL CHECK(reason IN ('overflow','manual')),
 log jsonb NOT NULL
);
ALTER TABLE public.audit_log_trash ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log_trash FROM anon,authenticated;
GRANT SELECT ON public.audit_log_trash TO authenticated;
DROP POLICY IF EXISTS founder_read_audit_trash ON public.audit_log_trash;
CREATE POLICY founder_read_audit_trash ON public.audit_log_trash FOR SELECT TO authenticated USING(public.is_app_founder());
CREATE INDEX IF NOT EXISTS audit_active_order ON public.audit_logs(visible_since DESC,waktu DESC,id DESC);
CREATE INDEX IF NOT EXISTS audit_trash_order ON public.audit_log_trash(archived_at DESC,id DESC);

-- Serialize before inserts; taking a table lock after inserts can deadlock concurrent writers.
CREATE OR REPLACE FUNCTION public.lock_audit_retention() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(202611030020::bigint);
 RETURN NULL;
END; $$;
CREATE OR REPLACE FUNCTION public.retain_twenty_audit_logs() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 WITH moved AS (
   DELETE FROM public.audit_logs WHERE id IN (
     SELECT id FROM public.audit_logs ORDER BY visible_since DESC,waktu DESC,id DESC OFFSET 20
   ) RETURNING *
 )
 INSERT INTO public.audit_log_trash(id,archived_at,archived_by,reason,log)
 SELECT id,clock_timestamp(),auth.uid(),'overflow',to_jsonb(moved) FROM moved
 ON CONFLICT(id) DO UPDATE SET archived_at=excluded.archived_at,archived_by=excluded.archived_by,reason=excluded.reason,log=excluded.log;
 RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.lock_audit_retention() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.retain_twenty_audit_logs() FROM PUBLIC;
DROP TRIGGER IF EXISTS lock_audit_retention ON public.audit_logs;
CREATE TRIGGER lock_audit_retention BEFORE INSERT ON public.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION public.lock_audit_retention();
DROP TRIGGER IF EXISTS retain_twenty_audit_logs ON public.audit_logs;
CREATE TRIGGER retain_twenty_audit_logs AFTER INSERT ON public.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION public.retain_twenty_audit_logs();

CREATE OR REPLACE FUNCTION public.archive_audit_logs(p_id uuid DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE moved_count integer;
BEGIN
 IF NOT public.is_app_founder() THEN RAISE EXCEPTION 'Hanya Founder yang dapat mengelola audit log'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(202611030020::bigint);
 WITH moved AS (
   DELETE FROM public.audit_logs WHERE p_id IS NULL OR id=p_id RETURNING *
 ), archived AS (
   INSERT INTO public.audit_log_trash(id,archived_at,archived_by,reason,log)
   SELECT id,clock_timestamp(),auth.uid(),'manual',to_jsonb(moved) FROM moved
   ON CONFLICT(id) DO UPDATE SET archived_at=excluded.archived_at,archived_by=excluded.archived_by,reason=excluded.reason,log=excluded.log
   RETURNING id
 ) SELECT count(*) INTO moved_count FROM archived;
 IF p_id IS NOT NULL AND moved_count=0 THEN RAISE EXCEPTION 'Audit log tidak ditemukan'; END IF;
 RETURN moved_count;
END; $$;
CREATE OR REPLACE FUNCTION public.restore_audit_log(p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE snapshot jsonb;
BEGIN
 IF NOT public.is_app_founder() THEN RAISE EXCEPTION 'Hanya Founder yang dapat mengelola audit log'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(202611030020::bigint);
 DELETE FROM public.audit_log_trash WHERE id=p_id RETURNING log INTO snapshot;
 IF NOT FOUND THEN RAISE EXCEPTION 'Audit log tidak ditemukan di Tempat Sampah'; END IF;
 INSERT INTO public.audit_logs(id,aktor,role,aksi,rincian,waktu,visible_since)
 VALUES ((snapshot->>'id')::uuid,snapshot->>'aktor',(snapshot->>'role')::public.role_aktor_type,snapshot->>'aksi',snapshot->>'rincian',(snapshot->>'waktu')::timestamptz,clock_timestamp());
 -- The original event time remains unchanged. Only active display priority is refreshed.
 RETURN true;
END; $$;
CREATE OR REPLACE FUNCTION public.purge_audit_log(p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_app_founder() THEN RAISE EXCEPTION 'Hanya Founder yang dapat mengelola audit log'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(202611030020::bigint);
 DELETE FROM public.audit_log_trash WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Audit log tidak ditemukan di Tempat Sampah'; END IF;
 RETURN true;
END; $$;

-- Existing overflow is moved by the next trusted audit insert after installation.
NOTIFY pgrst,'reload schema';
COMMIT;
