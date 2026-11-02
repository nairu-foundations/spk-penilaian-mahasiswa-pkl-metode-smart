-- Account and Super Admin role explicitly authorized by the project owner.
-- Apply only after creating the corresponding Supabase Auth user.
UPDATE public.app_profiles
SET role = 'super_admin',
    nama = 'Founder PT Seven Inc.',
    jabatan = 'Founder / Pemilik Perusahaan'
WHERE email = 'founder@seveninc.co.id'
RETURNING email, role;
