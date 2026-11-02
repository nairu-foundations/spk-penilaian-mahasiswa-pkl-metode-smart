# Data mahasiswa bersama di Supabase

Data Mahasiswa, Input Penilaian, Perhitungan SMART, hasil peringkat, dan tabel
mahasiswa pada halaman publik kini membaca `public.mahasiswa_pkl` di Supabase.
Perubahan tidak lagi disimpan sebagai data utama di localStorage.

1. Pastikan `.env` menunjuk ke proyek Supabase yang benar. Gunakan URL proyek dan
   publishable/anon key, lalu jalankan ulang `npm run dev`.
2. Jika database belum dibuat, jalankan `schema.sql` di SQL Editor Supabase.
3. Jalankan `migrations/20261103_shared_mahasiswa.sql` di SQL Editor proyek yang sama.
   Migrasi menambahkan kolom nilai dan fungsi impor transaksional. Data lama tetap ada.
   Jika muncul pesan tidak ada kriteria aktif, jalankan juga
   `migrations/20261103_restore_kriteria.sql`. Skrip ini memulihkan C1/C2/C3
   ke bobot 30/20/50 dan menambahkan kebijakan baca publik untuk kriteria.
   Hak tulis anonim tidak ditambahkan.
4. Buka **Data Mahasiswa** pada profil Chrome yang menyimpan perubahan lama.
   Klik **Salin data browser ke Supabase**. Tombol ini memperbarui mahasiswa dengan
   email yang sama; periksa data database lebih dulu jika sudah ada perubahan baru.
   Salinan browser lama tetap dipertahankan sebagai cadangan.
5. Buka alamat aplikasi yang sama di profil Chrome lain, lalu muat ulang halaman.
   Coba edit identitas, nilai, tambah/hapus mahasiswa, dan impor Excel.

Jika database menolak operasi, aplikasi menampilkan error dan tidak melaporkan
penyimpanan lokal sebagai keberhasilan. Migrasi menggunakan `SECURITY INVOKER` dan
tidak melonggarkan kebijakan RLS. Role database pemanggil harus memiliki izin yang
sesuai untuk tabel mahasiswa, penilaian, kriteria, dan fungsi impor. Login aplikasi
saat ini masih berupa login demo lokal, bukan sesi Supabase Auth; kebijakan yang
mensyaratkan pengguna Supabase terautentikasi membutuhkan integrasi autentikasi
terlebih dahulu. Jangan menaruh service-role key di variabel `VITE_*`.

Perubahan ini berfokus pada data mahasiswa dan penilaiannya. CMS, audit log lokal,
dan endpoint demo di `server.ts` memiliki alur penyimpanan terpisah.

Pemeriksaan lokal: `npm.cmd run lint`, `npm.cmd run build`, dan
`node --test tests/mahasiswaService.test.mjs`. Pengujian service memakai database
tiruan; jalankan migrasi dan uji lintas profil di Supabase untuk verifikasi integrasi.
