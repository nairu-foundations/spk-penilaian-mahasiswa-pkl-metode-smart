-- Retire the legacy PKL application module.
-- Intentionally omit CASCADE so unrelated dependent objects cannot be removed.
BEGIN;
SET LOCAL lock_timeout = '5s';
DROP TABLE IF EXISTS public.pengajuan_pkl;
NOTIFY pgrst, 'reload schema';
COMMIT;
