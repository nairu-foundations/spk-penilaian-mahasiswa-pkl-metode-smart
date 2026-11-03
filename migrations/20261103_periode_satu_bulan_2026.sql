-- Change the existing operational period to one month in 2026.
-- Historical certification snapshots and audit entries remain unchanged.
BEGIN;
UPDATE public.periode_pkl
SET nama_periode = 'Periode 1 - 2026', tanggal_mulai = '2026-01-01', tanggal_selesai = '2026-01-31'
WHERE id = 'c1111111-1111-4111-8111-111111111111' AND nama_periode = 'Periode 1 - 2025';

UPDATE public.mahasiswa_pkl
SET periode = 'Periode 1 - 2026', tanggal_mulai = '2026-01-01', tanggal_selesai = '2026-01-31'
WHERE periode = 'Periode 1 - 2025';
COMMIT;
