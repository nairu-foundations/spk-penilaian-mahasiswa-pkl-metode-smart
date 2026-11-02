# SPK SMART PKL - Sistem Pendukung Keputusan Pemilihan Tempat PKL

Aplikasi Sistem Penunjang Keputusan (SPK) untuk pemilihan dan rekomendasi tempat Praktik Kerja Lapangan (PKL) mahasiswa menggunakan metode ilmiah **SMART** (*Simple Multi Attribute Rating Technique*).

Aplikasi ini dibangun menggunakan arsitektur full-stack dengan **React (Vite) + Tailwind CSS + Supabase (PostgreSQL)** dan dirancang sesuai dengan rancangan antarmuka **PT Seven Inc.**

---

## 🚀 Fitur Utama

### 1. Sisi Mahasiswa & Publik
- **Landing Page Interaktif**: Berisi hero banner, fitur unggulan, 4 langkah penggunaan, daftar mitra perusahaan, FAQ, testimoni, dan pengumuman terbaru yang 100% dinamis dari database.
- **Daftar Tempat PKL (Mitra)**: Pencarian dan filter berdasarkan kota, bidang keahlian, dan kuota tersedia.
- **Kalkulator SMART Transparan**:
  - Slider penyesuaian bobot prioritas kriteria mandiri.
  - Perhitungan instan nilai utilitas (*Benefit* dan *Cost*).
  - Grafik perbandingan skor akhir menggunakan Recharts.
  - Matriks transparansi langkah normalisasi bobot $w_j$, utilitas $u_{ij}$, dan nilai akhir $S_i$.
  - Fitur pengajuan PKL langsung ke mitra pilihan.
- **Pengajuan Saya & Riwayat SMART**: Pelacakan status verifikasi (diajukan / disetujui / ditolak) dan catatan dari admin.
- **Profil Mahasiswa**: Pengelolaan data identitas akademik (NIM, Prodi, Angkatan, Kontak).

### 2. Sisi Dashboard Admin (Sesuai Desain Terlampir)
- **Dashboard Ringkasan**: 4 kartu metrik (Total Mahasiswa, Periode Aktif, Sudah Dinilai, Belum Dinilai), grafik tren nilai rata-rata per kriteria, dan distribusi peringkat.
- **Data Mahasiswa PKL**: Manajemen data mahasiswa lengkap dengan pencarian, filter prodi, dan modal tambah/edit.
- **Periode PKL**: Pengaturan jadwal periode pendaftaran (aktif/nonaktif).
- **Kriteria & Bobot SMART**: CRUD kriteria bertipe *benefit* atau *cost*, penyesuaian bobot, dan validasi total bobot 100%.
- **Input Penilaian**: Matriks nilai alternatif terhadap kriteria secara inline dilengkapi panduan rubrik skala 1–5.
- **Perhitungan SMART**: Stepper 3 tahapan (Normalisasi $\to$ Nilai Akhir $S_i$ $\to$ Peringkat) dengan perumusan matematis.
- **Hasil & Peringkat**: Kartu pemenang *Golden Trophy* untuk peringkat 1, tabel ranking lengkap, dan fitur ekspor data ke CSV serta cetak laporan.
- **Laporan Penilaian & Pengajuan**: Persetujuan/penolakan pengajuan PKL mahasiswa disertai catatan resmi.
- **CMS Konten Web**: Pengeditan langsung identitas situs, hero banner, kontak, dan teks tanpa mengubah kode sumber.
- **Navigasi Sidebar**: Desain *dark navy* elegan khas PT Seven Inc. yang responsif di perangkat desktop maupun ponsel.

---

## 📐 Rumus & Logika Metode SMART

1. **Normalisasi Bobot**:
   $$w_j = \frac{\text{bobot}_j}{\sum_{k=1}^m \text{bobot}_k}$$

2. **Nilai Utilitas ($u_{ij}$)**:
   - **Kriteria Benefit** (nilai semakin besar semakin baik):
     $$u_{ij} = \frac{C_{\text{out}} - C_{\min}}{C_{\max} - C_{\min}}$$
   - **Kriteria Cost** (nilai semakin kecil semakin baik, misal jarak lokasi):
     $$u_{ij} = \frac{C_{\max} - C_{\text{out}}}{C_{\max} - C_{\min}}$$
   - *Jika $C_{\max} = C_{\min}$, maka $u_{ij} = 1.0$*

3. **Skor Akhir ($S_i$)**:
   $$S_i = \sum_{j=1}^m (w_j \times u_{ij})$$

---

## 🗄️ Setup Database Supabase (PostgreSQL)

File migrasi SQL telah disediakan di direktori utama:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyek Anda.
2. Buka menu **SQL Editor**.
3. Jalankan seluruh isi file **`schema.sql`** untuk membuat tabel, relasi, fungsi `is_admin()`, trigger `handle_new_user()`, dan aturan Row Level Security (RLS).
4. Jalankan seluruh isi file **`seed.sql`** untuk mengisi data awal kriteria, skala nilai, 10 mitra PKL, pengumuman, dan konfigurasi CMS.
5. Salin URL Project dan Anon Key ke file `.env`:
   ```bash
   VITE_SUPABASE_URL="https://xyzcompany.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```

*Catatan: Jika kredensial Supabase belum diisi, aplikasi secara otomatis berjalan dalam mode fallback interaktif (data persisten di LocalStorage peramban) sehingga dapat diuji secara langsung.*

---

## 🔑 Akun Demo Pengujian

- **Admin HRD**:
  - Username: `admin` atau `hrd`
  - Password: `admin123`
  - Akses: Semua menu Dashboard Admin, Kelola Kriteria, Input Penilaian, Verifikasi Pengajuan, dan CMS.

- **Mahasiswa**:
  - NIM: `20241001` (Andi Pratama)
  - Password: `password123`
  - Akses: Hitung SMART, Simulasi Slider, Pengajuan PKL, Riwayat.
