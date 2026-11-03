-- HRD account and admin access explicitly requested by the project owner.
-- Run after the account exists in Supabase Auth.
UPDATE public.app_profiles
SET role = 'admin', nama = 'Admin HRD PT Seven Inc.', jabatan = 'HRD Officer (Admin)'
WHERE email = 'adminseveninc@gmail.com'
RETURNING email, role;
