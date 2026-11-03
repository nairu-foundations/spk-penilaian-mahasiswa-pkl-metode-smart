-- User-selected month supersedes the initial January default.
BEGIN;
UPDATE public.periode_pkl
SET tanggal_mulai = '2026-10-01', tanggal_selesai = '2026-10-31'
WHERE id = 'c1111111-1111-4111-8111-111111111111' AND nama_periode = 'Periode 1 - 2026';

UPDATE public.mahasiswa_pkl
SET tanggal_mulai = '2026-10-01', tanggal_selesai = '2026-10-31'
WHERE periode = 'Periode 1 - 2026';
COMMIT;
