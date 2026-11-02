import {
  Alternatif,
  FAQItem,
  FiturItem,
  HeroSection,
  Kriteria,
  LangkahPenggunaan,
  MenuNavigasi,
  NilaiAlternatif,
  PengajuanPKL,
  PengumumanItem,
  PeriodePKL,
  SiteSettings,
  SkalaNilai,
  TestimoniItem,
  MahasiswaPKL,
} from '../types';

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  nama_situs: 'SMART PKL',
  tagline: 'Sistem Pendukung Keputusan Pemilihan & Rekomendasi Tempat PKL',
  nama_perusahaan_host: 'PT Seven Inc.',
  deskripsi_singkat: 'Platform pengambilan keputusan berbasis metode SMART untuk mencocokkan mahasiswa dengan mitra PKL terbaik secara objektif dan transparan.',
  email_kontak: 'pkl-support@seveninc.co.id',
  telepon_kontak: '+62 821-3456-7890',
  alamat_kontak: 'Jl. Ringroad Utara No. 7, Sleman, D.I. Yogyakarta',
  teks_footer: '© 2026 PT Seven Inc. Hak cipta dilindungi undang-undang. Bersama membangun generasi profesional yang disiplin dan kompeten.',
  quote_login: 'Disiplin hari ini, kesuksesan esok hari.',
};

export const INITIAL_HERO: HeroSection = {
  id: 'hero-1',
  judul: 'Temukan Tempat PKL Terbaik Sesuai Preferensi & Kompetensi Anda',
  subjudul: 'Didukung metode ilmiah SMART (Simple Multi Attribute Rating Technique) yang objektif, transparan, dan mempertimbangkan kesesuaian prodi, fasilitas, reputasi, hingga prospek karier.',
  teks_tombol_utama: 'Mulai Hitung Rekomendasi',
  link_tombol_utama: '/proses-smart',
  teks_tombol_sekunder: 'Jelajahi Mitra PKL',
  link_tombol_sekunder: '/tempat-pkl',
  gambar_url: '',
};

export const INITIAL_KRITERIA: Kriteria[] = [
  {
    id: 'k-1',
    kode: 'C1',
    nama: 'Kehadiran',
    tipe: 'benefit',
    bobot_awal: 30,
    deskripsi: 'Tingkat partisipasi dan presensi kehadiran mahasiswa selama periode PKL di PT Seven Inc. (Skala 0–100)',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'k-2',
    kode: 'C2',
    nama: 'Ketepatan Waktu',
    tipe: 'benefit',
    bobot_awal: 20,
    deskripsi: 'Kedisiplinan mahasiswa dalam mematuhi jam masuk kerja dan aturan waktu operasional (Skala 0–100)',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'k-3',
    kode: 'C3',
    nama: 'Penyelesaian Tugas',
    tipe: 'benefit',
    bobot_awal: 50,
    deskripsi: 'Pencapaian tanggung jawab, target hasil kerja, dan performa penuntasan proyek kerja magang (Skala 0–100)',
    urutan: 3,
    aktif: true,
  },
];

export const INITIAL_SKALA: SkalaNilai[] = [
  // C1
  { id: 's-1-1', kriteria_id: 'k-1', nilai: 5, keterangan: 'Sangat Sesuai (100% relevan dengan core kompetensi)' },
  { id: 's-1-2', kriteria_id: 'k-1', nilai: 4, keterangan: 'Sesuai (75% relevan dengan konsentrasi keilmuan)' },
  { id: 's-1-3', kriteria_id: 'k-1', nilai: 3, keterangan: 'Cukup Sesuai (50% relevan dengan ilmu pendukung)' },
  { id: 's-1-4', kriteria_id: 'k-1', nilai: 2, keterangan: 'Kurang Sesuai (25% relevan)' },
  { id: 's-1-5', kriteria_id: 'k-1', nilai: 1, keterangan: 'Tidak Sesuai (0% relevan lintas disiplin)' },

  // C2 (Cost: Skala nilai matematis 1-5 di mana nilai riil jarak dinilai 1-5, atau nilai 5 = jarak sangat jauh / biaya tinggi)
  { id: 's-2-1', kriteria_id: 'k-2', nilai: 1, keterangan: '< 3 km (Sangat Dekat, dapat ditempuh jalan kaki/sepeda)' },
  { id: 's-2-2', kriteria_id: 'k-2', nilai: 2, keterangan: '3 - 8 km (Dekat, 10-15 menit berkendara)' },
  { id: 's-2-3', kriteria_id: 'k-2', nilai: 3, keterangan: '8 - 15 km (Sedang, berada di dalam kawasan kota)' },
  { id: 's-2-4', kriteria_id: 'k-2', nilai: 4, keterangan: '15 - 25 km (Jauh, antar-kabupaten/pinggiran kota)' },
  { id: 's-2-5', kriteria_id: 'k-2', nilai: 5, keterangan: '> 25 km (Sangat Jauh, butuh kost/hunian khusus)' },

  // C3
  { id: 's-3-1', kriteria_id: 'k-3', nilai: 5, keterangan: 'Sangat Lengkap (Uang saku UMR + laptop + konsumsi harian)' },
  { id: 's-3-2', kriteria_id: 'k-3', nilai: 4, keterangan: 'Lengkap (Uang saku layak + laptop kantor)' },
  { id: 's-3-3', kriteria_id: 'k-3', nilai: 3, keterangan: 'Cukup (Uang transport/makan standar)' },
  { id: 's-3-4', kriteria_id: 'k-3', nilai: 2, keterangan: 'Kurang (Hanya fasilitas ruang kerja)' },
  { id: 's-3-5', kriteria_id: 'k-3', nilai: 1, keterangan: 'Tidak Ada Fasilitas Finansial (Hanya sertifikat)' },

  // C4
  { id: 's-4-1', kriteria_id: 'k-4', nilai: 5, keterangan: 'Korporasi Multinasional / Unicorn / BUMN Tier-1' },
  { id: 's-4-2', kriteria_id: 'k-4', nilai: 4, keterangan: 'Perusahaan Nasional Terkemuka / Skala Menengah Atas' },
  { id: 's-4-3', kriteria_id: 'k-4', nilai: 3, keterangan: 'Instansi Pemerintah Daerah / Perusahaan Berkembang' },
  { id: 's-4-4', kriteria_id: 'k-4', nilai: 2, keterangan: 'Startup Rintisan Awal / UMKM Lokal' },
  { id: 's-4-5', kriteria_id: 'k-4', nilai: 1, keterangan: 'Belum Terakreditasi / Usaha Perorangan' },

  // C5
  { id: 's-5-1', kriteria_id: 'k-5', nilai: 5, keterangan: 'Tinggi Sekali (> 60% pemagang berkinerja baik diangkat)' },
  { id: 's-5-2', kriteria_id: 'k-5', nilai: 4, keterangan: 'Tinggi (Prioritas utama pada proses seleksi karyawan baru)' },
  { id: 's-5-3', kriteria_id: 'k-5', nilai: 3, keterangan: 'Sedang (Ada program talent pool)' },
  { id: 's-5-4', kriteria_id: 'k-5', nilai: 2, keterangan: 'Rendah (Perekrutan hanya jika ada posisi kosong)' },
  { id: 's-5-5', kriteria_id: 'k-5', nilai: 1, keterangan: 'Sangat Rendah (Tidak ada kebijakan penyerapan alumni PKL)' },
];

export const INITIAL_ALTERNATIF: Alternatif[] = [
  {
    id: 'alt-1',
    kode: 'A1',
    nama_perusahaan: 'PT Seven Inc. - Divisi IT / Software Engineering',
    bidang: 'Software Engineering & SaaS Development',
    alamat: 'Jl. Ringroad Utara No. 7, Sleman',
    kota: 'D.I. Yogyakarta',
    kuota: 6,
    kuota_terisi: 1,
    deskripsi: 'Unit rekayasa perangkat lunak PT Seven Inc. yang menangani pengembangan platform web, mobile app, dan cloud infrastructure.',
    kontak: 'it-dev@seveninc.co.id',
    website: 'https://seveninc.co.id',
    aktif: true,
  },
  {
    id: 'alt-2',
    kode: 'A2',
    nama_perusahaan: 'PT Seven Inc. - Divisi HRD & Talent Development',
    bidang: 'Human Resources & People Operations',
    alamat: 'Jl. Ringroad Utara No. 7, Sleman',
    kota: 'D.I. Yogyakarta',
    kuota: 4,
    kuota_terisi: 1,
    deskripsi: 'Unit pengelolaan sumber daya manusia, kultur organisasi, dan pembinaan kedisiplinan program magang PT Seven Inc.',
    kontak: 'hrd@seveninc.co.id',
    website: 'https://seveninc.co.id',
    aktif: true,
  },
  {
    id: 'alt-3',
    kode: 'A3',
    nama_perusahaan: 'PT Seven Inc. - Divisi Marketing & Public Relations',
    bidang: 'Digital Marketing & Corporate Communications',
    alamat: 'Jl. Ringroad Utara No. 7, Sleman',
    kota: 'D.I. Yogyakarta',
    kuota: 5,
    kuota_terisi: 1,
    deskripsi: 'Divisi pemasaran digital, branding produk, dan relasi mitra strategis industri PT Seven Inc.',
    kontak: 'marketing@seveninc.co.id',
    website: 'https://seveninc.co.id',
    aktif: true,
  },
  {
    id: 'alt-4',
    kode: 'A4',
    nama_perusahaan: 'PT Seven Inc. - Divisi Accounting & Finance',
    bidang: 'Corporate Finance & Auditing',
    alamat: 'Jl. Ringroad Utara No. 7, Sleman',
    kota: 'D.I. Yogyakarta',
    kuota: 4,
    kuota_terisi: 1,
    deskripsi: 'Divisi pencatatan keuangan korporasi, budgeting proyek, dan audit operasional PT Seven Inc.',
    kontak: 'finance@seveninc.co.id',
    website: 'https://seveninc.co.id',
    aktif: true,
  },
  {
    id: 'alt-5',
    kode: 'A5',
    nama_perusahaan: 'PT Seven Inc. - Divisi IT Infrastructure & Network',
    bidang: 'System Administration & Security',
    alamat: 'Jl. Ringroad Utara No. 7, Sleman',
    kota: 'D.I. Yogyakarta',
    kuota: 4,
    kuota_terisi: 1,
    deskripsi: 'Divisi pengelolaan server data center, keamanan jaringan, dan hardware operasional PT Seven Inc.',
    kontak: 'sysadmin@seveninc.co.id',
    website: 'https://seveninc.co.id',
    aktif: true,
  },
];

// Matrix Nilai Alternatif terhadap Kriteria (C1..C5)
export const INITIAL_NILAI: NilaiAlternatif[] = [
  // A1: Telkom (C1:5, C2:3, C3:4, C4:5, C5:4)
  { alternatif_id: 'alt-1', kriteria_id: 'k-1', nilai: 5 },
  { alternatif_id: 'alt-1', kriteria_id: 'k-2', nilai: 3 },
  { alternatif_id: 'alt-1', kriteria_id: 'k-3', nilai: 4 },
  { alternatif_id: 'alt-1', kriteria_id: 'k-4', nilai: 5 },
  { alternatif_id: 'alt-1', kriteria_id: 'k-5', nilai: 4 },

  // A2: Seven Inc. (C1:5, C2:2, C3:4, C4:4, C5:5)
  { alternatif_id: 'alt-2', kriteria_id: 'k-1', nilai: 5 },
  { alternatif_id: 'alt-2', kriteria_id: 'k-2', nilai: 2 },
  { alternatif_id: 'alt-2', kriteria_id: 'k-3', nilai: 4 },
  { alternatif_id: 'alt-2', kriteria_id: 'k-4', nilai: 4 },
  { alternatif_id: 'alt-2', kriteria_id: 'k-5', nilai: 5 },

  // A3: Gojek (C1:5, C2:2, C3:5, C4:5, C5:5)
  { alternatif_id: 'alt-3', kriteria_id: 'k-1', nilai: 5 },
  { alternatif_id: 'alt-3', kriteria_id: 'k-2', nilai: 2 },
  { alternatif_id: 'alt-3', kriteria_id: 'k-3', nilai: 5 },
  { alternatif_id: 'alt-3', kriteria_id: 'k-4', nilai: 5 },
  { alternatif_id: 'alt-3', kriteria_id: 'k-5', nilai: 5 },

  // A4: Diskominfo (C1:4, C2:3, C3:2, C4:4, C5:2)
  { alternatif_id: 'alt-4', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-4', kriteria_id: 'k-2', nilai: 3 },
  { alternatif_id: 'alt-4', kriteria_id: 'k-3', nilai: 2 },
  { alternatif_id: 'alt-4', kriteria_id: 'k-4', nilai: 4 },
  { alternatif_id: 'alt-4', kriteria_id: 'k-5', nilai: 2 },

  // A5: BCA (C1:4, C2:3, C3:4, C4:5, C5:4)
  { alternatif_id: 'alt-5', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-5', kriteria_id: 'k-2', nilai: 3 },
  { alternatif_id: 'alt-5', kriteria_id: 'k-3', nilai: 4 },
  { alternatif_id: 'alt-5', kriteria_id: 'k-4', nilai: 5 },
  { alternatif_id: 'alt-5', kriteria_id: 'k-5', nilai: 4 },

  // A6: Gameloft (C1:5, C2:4, C3:4, C4:4, C5:4)
  { alternatif_id: 'alt-6', kriteria_id: 'k-1', nilai: 5 },
  { alternatif_id: 'alt-6', kriteria_id: 'k-2', nilai: 4 },
  { alternatif_id: 'alt-6', kriteria_id: 'k-3', nilai: 4 },
  { alternatif_id: 'alt-6', kriteria_id: 'k-4', nilai: 4 },
  { alternatif_id: 'alt-6', kriteria_id: 'k-5', nilai: 4 },

  // A7: GMEDIA (C1:4, C2:3, C3:3, C4:3, C5:3)
  { alternatif_id: 'alt-7', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-7', kriteria_id: 'k-2', nilai: 3 },
  { alternatif_id: 'alt-7', kriteria_id: 'k-3', nilai: 3 },
  { alternatif_id: 'alt-7', kriteria_id: 'k-4', nilai: 3 },
  { alternatif_id: 'alt-7', kriteria_id: 'k-5', nilai: 3 },

  // A8: Qwords (C1:4, C2:2, C3:3, C4:3, C5:4)
  { alternatif_id: 'alt-8', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-8', kriteria_id: 'k-2', nilai: 2 },
  { alternatif_id: 'alt-8', kriteria_id: 'k-3', nilai: 3 },
  { alternatif_id: 'alt-8', kriteria_id: 'k-4', nilai: 3 },
  { alternatif_id: 'alt-8', kriteria_id: 'k-5', nilai: 4 },

  // A9: Kuncie (C1:4, C2:2, C3:3, C4:3, C5:3)
  { alternatif_id: 'alt-9', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-9', kriteria_id: 'k-2', nilai: 2 },
  { alternatif_id: 'alt-9', kriteria_id: 'k-3', nilai: 3 },
  { alternatif_id: 'alt-9', kriteria_id: 'k-4', nilai: 3 },
  { alternatif_id: 'alt-9', kriteria_id: 'k-5', nilai: 3 },

  // A10: Suitmedia (C1:4, C2:3, C3:3, C4:4, C5:3)
  { alternatif_id: 'alt-10', kriteria_id: 'k-1', nilai: 4 },
  { alternatif_id: 'alt-10', kriteria_id: 'k-2', nilai: 3 },
  { alternatif_id: 'alt-10', kriteria_id: 'k-3', nilai: 3 },
  { alternatif_id: 'alt-10', kriteria_id: 'k-4', nilai: 4 },
  { alternatif_id: 'alt-10', kriteria_id: 'k-5', nilai: 3 },
];

export const INITIAL_PERIODE: PeriodePKL[] = [
  {
    id: 'per-1',
    nama_periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    status: 'Aktif',
  },
  {
    id: 'per-2',
    nama_periode: 'Periode 2 - 2025',
    tanggal_mulai: '2025-07-01',
    tanggal_selesai: '2025-12-31',
    status: 'Nonaktif',
  },
  {
    id: 'per-3',
    nama_periode: 'Periode 1 - 2024',
    tanggal_mulai: '2024-01-01',
    tanggal_selesai: '2024-06-30',
    status: 'Nonaktif',
  },
];

export const INITIAL_MAHASISWA: MahasiswaPKL[] = [
  {
    id: 'mhs-1',
    nama: 'Andi Pratama',
    nim: '20241001',
    institusi: 'UGM',
    bagian: 'IT / Software Engineering',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '081234567891',
    email: 'andi.pratama@mhs.ac.id',
    status: 'Aktif',
    skor_akhir_smart: 0.92,
    peringkat: 1,
    keterangan_nilai: 'Sangat Baik',
  },
  {
    id: 'mhs-2',
    nama: 'Siti Nurhaliza',
    nim: '20241002',
    institusi: 'UPN',
    bagian: 'Marketing & PR',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '081234567892',
    email: 'siti.nurhaliza@mhs.ac.id',
    status: 'Aktif',
    skor_akhir_smart: 0.85,
    peringkat: 3,
    keterangan_nilai: 'Baik',
  },
  {
    id: 'mhs-3',
    nama: 'Budi Santoso',
    nim: '20241003',
    institusi: 'UII',
    bagian: 'Accounting & Finance',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '081234567893',
    email: 'budi.santoso@mhs.ac.id',
    status: 'Aktif',
    skor_akhir_smart: 0.80,
    peringkat: 4,
    keterangan_nilai: 'Cukup',
  },
  {
    id: 'mhs-4',
    nama: 'Rina Anggraini',
    nim: '20241004',
    institusi: 'UNY',
    bagian: 'HRD & Talent Development',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '081234567894',
    email: 'rina.anggraini@mhs.ac.id',
    status: 'Aktif',
    skor_akhir_smart: 0.88,
    peringkat: 2,
    keterangan_nilai: 'Baik',
  },
  {
    id: 'mhs-5',
    nama: 'Dika Pratama',
    nim: '20241005',
    institusi: 'ITY',
    bagian: 'IT / Infrastructure',
    periode: 'Periode 1 - 2025',
    tanggal_mulai: '2025-01-01',
    tanggal_selesai: '2025-06-30',
    no_hp: '081234567895',
    email: 'dika.pratama@mhs.ac.id',
    status: 'Aktif',
    skor_akhir_smart: 0.74,
    peringkat: 5,
    keterangan_nilai: 'Cukup',
  },
];

export const INITIAL_PENGAJUAN: PengajuanPKL[] = [
  {
    id: 'peng-1',
    user_id: 'mhs-1',
    alternatif_id: 'alt-3',
    periode_id: 'per-1',
    status: 'disetujui',
    catatan_admin: 'Berkas portfolio lengkap dan nilai SMART berada di peringkat 1.',
    created_at: '2025-01-05T09:30:00Z',
    skor_smart: 0.9412,
  },
  {
    id: 'peng-2',
    user_id: 'mhs-2',
    alternatif_id: 'alt-2',
    periode_id: 'per-1',
    status: 'diajukan',
    catatan_admin: 'Sedang diverifikasi oleh koordinator program studi.',
    created_at: '2025-01-07T14:15:00Z',
    skor_smart: 0.8845,
  },
  {
    id: 'peng-3',
    user_id: 'mhs-3',
    alternatif_id: 'alt-5',
    periode_id: 'per-1',
    status: 'disetujui',
    catatan_admin: 'Memenuhi kriteria jurusan Akuntansi untuk divisi Keuangan.',
    created_at: '2025-01-08T11:00:00Z',
    skor_smart: 0.8250,
  },
  {
    id: 'peng-4',
    user_id: 'mhs-4',
    alternatif_id: 'alt-2',
    periode_id: 'per-1',
    status: 'diajukan',
    catatan_admin: 'Menunggu konfirmasi kuota dari HRD PT Seven Inc.',
    created_at: '2025-01-10T16:20:00Z',
    skor_smart: 0.8520,
  },
  {
    id: 'peng-5',
    user_id: 'mhs-5',
    alternatif_id: 'alt-4',
    periode_id: 'per-1',
    status: 'ditolak',
    catatan_admin: 'Kuota divisi IT Diskominfo telah penuh untuk periode ini.',
    created_at: '2025-01-12T10:45:00Z',
    skor_smart: 0.7420,
  },
];

export const INITIAL_FITUR: FiturItem[] = [
  {
    id: 'f-1',
    ikon: 'Calculator',
    judul: 'Algoritma SMART Transparan',
    deskripsi: 'Menghitung nilai utilitas benefit dan cost secara matematis serta membuka rincian rumus ke mahasiswa tanpa kotak hitam.',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'f-2',
    ikon: 'SlidersHorizontal',
    judul: 'Kustomisasi Bobot Preferensi',
    deskripsi: 'Mahasiswa dapat menyesuaikan skala prioritas pribadi (misal mengutamakan jarak dekat atau uang saku) secara interaktif.',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'f-3',
    ikon: 'Building2',
    judul: 'Database Mitra Terverifikasi',
    deskripsi: 'Informasi lengkap profil perusahaan, kuota penerimaan, alamat, kontak HRD, dan bidang spesialisasi kerja.',
    urutan: 3,
    aktif: true,
  },
  {
    id: 'f-4',
    ikon: 'FileCheck',
    judul: 'Pengajuan PKL Terintegrasi',
    deskripsi: 'Ajukan lamaran magang langsung dari hasil rekomendasi terbaik dan pantau proses verifikasi admin secara real-time.',
    urutan: 4,
    aktif: true,
  },
  {
    id: 'f-5',
    ikon: 'BarChart3',
    judul: 'Visualisasi & Export Hasil',
    deskripsi: 'Dilengkapi grafik perbandingan skor alternatif serta fitur ekspor laporan ke format PDF dan spreadsheet siap cetak.',
    urutan: 5,
    aktif: true,
  },
  {
    id: 'f-6',
    ikon: 'ShieldCheck',
    judul: 'Keamanan Berbasis Role (RBAC)',
    deskripsi: 'Pemisahan hak akses yang tegas antara mahasiswa dan tim admin pengelola data akademik menggunakan Supabase RLS.',
    urutan: 6,
    aktif: true,
  },
];

export const INITIAL_LANGKAH: LangkahPenggunaan[] = [
  {
    id: 'l-1',
    nomor: 1,
    judul: 'Buat Akun & Lengkapi Profil',
    deskripsi: 'Daftarkan diri dengan NIM, program studi, angkatan, dan kontak aktif Anda.',
  },
  {
    id: 'l-2',
    nomor: 2,
    judul: 'Atur Bobot Prioritas Anda',
    deskripsi: 'Gunakan slider untuk menyesuaikan seberapa penting kesesuaian prodi, jarak, atau fasilitas bagi Anda.',
  },
  {
    id: 'l-3',
    nomor: 3,
    judul: 'Hitung & Analisis Hasil SMART',
    deskripsi: 'Lihat peringkat tempat PKL paling cocok lengkap dengan rincian perhitungan utilitas matematis.',
  },
  {
    id: 'l-4',
    nomor: 4,
    judul: 'Kirim Pengajuan ke Mitra',
    deskripsi: 'Pilih mitra peringkat teratas Anda dan ajukan PKL untuk ditinjau oleh koordinator kampus.',
  },
];

export const INITIAL_FAQ: FAQItem[] = [
  {
    id: 'faq-1',
    pertanyaan: 'Apa itu metode SMART dalam pemilihan tempat PKL?',
    jawaban: 'SMART (Simple Multi Attribute Rating Technique) adalah metode pengambilan keputusan multikriteria yang mengevaluasi setiap alternatif berdasarkan pembobotan nilai utilitas (benefit dan cost) untuk menghasilkan skor akhir yang objektif.',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'faq-2',
    pertanyaan: 'Apakah saya bisa mengubah bobot kriteria sesuai kebutuhan sendiri?',
    jawaban: 'Ya. Sistem menyediakan slider kustomisasi bobot di mana Anda dapat memprioritaskan kriteria tertentu, seperti memperbesar bobot jarak dekat jika tidak memiliki kendaraan pribadi.',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'faq-3',
    pertanyaan: 'Bagaimana cara menentukan kriteria bertipe Benefit dan Cost?',
    jawaban: 'Kriteria Benefit (seperti Relevansi Prodi, Fasilitas, Reputasi) adalah kriteria yang nilainya semakin besar semakin menguntungkan. Kriteria Cost (seperti Jarak Tempuh) adalah kriteria yang nilainya semakin kecil semakin menguntungkan.',
    urutan: 3,
    aktif: true,
  },
  {
    id: 'faq-4',
    pertanyaan: 'Berapa jumlah tempat PKL yang bisa saya ajukan dalam satu periode?',
    jawaban: 'Mahasiswa dapat mengajukan 1 mitra PKL aktif sekaligus agar proses penempatan tertib dan kuota mitra tidak terkunci ganda.',
    urutan: 4,
    aktif: true,
  },
  {
    id: 'faq-5',
    pertanyaan: 'Apakah hasil perhitungan SMART otomatis mengikat penempatan PKL?',
    jawaban: 'Hasil SMART berfungsi sebagai rekomendasi ilmiah penunjang keputusan. Persetujuan akhir tetap dikoordinasikan oleh tim akademik dan ketersediaan kuota resmi dari mitra terkait.',
    urutan: 5,
    aktif: true,
  },
  {
    id: 'faq-6',
    pertanyaan: 'Bagaimana jika kriteria atau alternatif tempat PKL berubah?',
    jawaban: 'Admin dapat memperbarui data kriteria, bobot standar, maupun daftar mitra kapan saja melalui panel Dashboard Admin.',
    urutan: 6,
    aktif: true,
  },
];

export const INITIAL_TESTIMONI: TestimoniItem[] = [
  {
    id: 't-1',
    nama: 'Bagus Wicaksono',
    jabatan: 'Alumni PKL - Software Engineering',
    instansi: 'Ditempatkan di Gojek Tech Hub',
    isi: 'Metode SMART sangat membantu saya menemukan tempat PKL yang sesuai dengan minat backend engineering. Berkat rekomendasi akurat ini, saya langsung ditawari kontrak kerja setelah lulus!',
    aktif: true,
  },
  {
    id: 't-2',
    nama: 'Nabila Putri, S.Kom',
    jabatan: 'Koordinator Magang & Kerjasama Industri',
    instansi: 'Fakultas Ilmu Komputer',
    isi: 'Sistem ini memangkas waktu seleksi dan komplain penempatan mahasiswa hingga 80%. Prosesnya adil, terbuka, dan didukung bukti perhitungan yang kuat.',
    aktif: true,
  },
  {
    id: 't-3',
    nama: 'Hendra Gunawan',
    jabatan: 'Head of People & Culture',
    instansi: 'PT Seven Inc.',
    isi: 'Mahasiswa yang magang di tempat kami melalui sistem ini memiliki kecocokan kompetensi yang jauh lebih tinggi dengan kebutuhan proyek riil industri kami.',
    aktif: true,
  },
];

export const INITIAL_PENGUMUMAN: PengumumanItem[] = [
  {
    id: 'p-1',
    judul: 'Pembukaan Pendaftaran PKL Periode 1 - 2025',
    kategori: 'Pendaftaran',
    tanggal: '15 Januari 2025',
    isi: 'Pendaftaran dan pengajuan tempat PKL Periode 1 resmi dibuka hingga 28 Februari 2025. Harap segera melengkapi profil dan menjalankan perhitungan SMART.',
    dipublikasi: true,
  },
  {
    id: 'p-2',
    judul: 'Penambahan Kuota Mitra Industri PT Seven Inc. & Telkom',
    kategori: 'Mitra',
    tanggal: '22 Januari 2025',
    isi: 'Kabar gembira! Kuota mahasiswa untuk divisi Software Engineering dan Digital Marketing di PT Seven Inc. dan PT Telkom bertambah sebanyak 5 kursi.',
    dipublikasi: true,
  },
  {
    id: 'p-3',
    judul: 'Sosialisasi Tata Tertib dan Logbook Harian PKL',
    kategori: 'Panduan',
    tanggal: '01 Februari 2025',
    isi: 'Seluruh mahasiswa yang telah disetujui pengajuannya wajib mengikuti pembekalan daring via Zoom pada hari Sabtu, 8 Februari 2025 pukul 09.00 WIB.',
    dipublikasi: true,
  },
];

export const INITIAL_MENU: MenuNavigasi[] = [
  { id: 'm-1', label: 'Penilaian & Peringkat PKL', path: '/', role_akses: 'semua', urutan: 1, aktif: true },
  { id: 'm-2', label: 'Dashboard Admin', path: '/admin', role_akses: 'admin', urutan: 2, aktif: true },
];

