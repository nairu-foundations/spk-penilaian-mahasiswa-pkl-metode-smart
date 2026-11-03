export type Role = 'super_admin' | 'admin' | 'mahasiswa';

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  jabatan: string; // e.g. 'Founder & CEO PT Seven Inc.' | 'HRD Officer PT Seven Inc.' | 'Mahasiswa PKL PT Seven Inc.'
  role: Role;
  nim?: string;
  bagian?: string;
  institusi?: string;
  prodi?: string;
  angkatan?: string;
  periode?: string;
  no_hp?: string;
  avatar_url?: string;
  created_at?: string;
  kuasa_penuh?: boolean;
}

export type KriteriaType = 'benefit' | 'cost';

export interface Kriteria {
  id: string;
  kode: string; // C1, C2, etc.
  nama: string;
  tipe: KriteriaType;
  bobot_awal: number; // e.g., 40, 30, 30
  deskripsi: string;
  urutan: number;
  aktif: boolean;
}


export interface RekapBulananPKL {
  hari_kerja: number;
  hari_hadir: number;
  hari_tepat_waktu: number;
  target_tugas: number;
  tugas_selesai: number;
  dasar_c2: 'hari_kerja' | 'hari_hadir';
  tanggal_mulai: string;
  tanggal_selesai: string;
  sumber?: string;
  harian?: {
    tanggal: string;
    hadir: boolean;
    jam_masuk: string | null;
    tepat_waktu: boolean | null;
    target_tugas: number;
    tugas_selesai: number;
  }[];
}

export interface MahasiswaPKL {
  id: string;
  kode_alternatif?: string; // A1, A2, A3, etc.
  nama: string;
  nim: string;
  institusi?: string;
  bagian: string;
  periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  no_hp: string;
  email: string;
  status: 'Aktif' | 'Selesai' | 'Menunggu Verifikasi';
  pembimbing_industri?: string;
  catatan_evaluasi?: string;
  rekap_bulanan?: RekapBulananPKL | null;
  nilai_kriteria?: Record<string, number>; // { C1: 95, C2: 90, C3: 92 }
  utility?: Record<string, number>;        // { C1: 0.95, C2: 0.90, C3: 0.92 }
  skor_akhir_smart?: number;
  nilai_skala_100?: number;
  peringkat?: number;
  keterangan_nilai?: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
}

export interface Alternatif {
  id: string;
  kode: string;
  nama_perusahaan: string;
  bidang: string;
  alamat: string;
  kota: string;
  kuota: number;
  kuota_terisi?: number;
  deskripsi: string;
  logo_url?: string;
  kontak: string;
  email?: string;
  website?: string;
  aktif: boolean;
}

export interface SkalaNilai {
  id: string;
  kriteria_id: string;
  nilai: number; // 1 to 5
  keterangan: string;
}

export interface NilaiAlternatif {
  id?: string;
  alternatif_id: string;
  kriteria_id: string;
  nilai: number;
}

export interface PeriodePKL {
  id: string;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface HasilDetail {
  id?: string;
  hasil_id?: string;
  alternatif_id: string;
  alternatif?: Alternatif;
  skor_akhir: number;
  peringkat: number;
  utilitas: Record<string, number>;
  kategori?: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
}

export interface HasilPerhitungan {
  id: string;
  user_id: string;
  created_at: string;
  bobot_snapshot: Record<string, number>;
  catatan?: string;
  ranking: HasilDetail[];
}

export type StatusPengajuan = 'diajukan' | 'disetujui' | 'ditolak';

export interface PengajuanPKL {
  id: string;
  user_id: string;
  mahasiswa?: UserProfile;
  alternatif_id: string;
  alternatif?: Alternatif;
  periode_id?: string;
  status: StatusPengajuan;
  catatan_admin?: string;
  created_at: string;
  skor_smart?: number;
}

export interface AuditLog {
  id: string;
  aktor: string;
  role: Role;
  aksi: string;
  rincian: string;
  waktu: string;
}

// Site Settings & CMS Models
export interface SiteSettings {
  nama_situs: string;
  tagline: string;
  nama_perusahaan_host: string;
  deskripsi_singkat: string;
  email_kontak: string;
  telepon_kontak: string;
  alamat_kontak: string;
  teks_footer: string;
  quote_login: string;
  nama_founder?: string;
}

export interface HeroSection {
  id: string;
  judul: string;
  subjudul: string;
  teks_tombol_utama: string;
  link_tombol_utama: string;
  teks_tombol_sekunder: string;
  link_tombol_sekunder: string;
  gambar_url?: string;
}

export interface FiturItem {
  id: string;
  ikon: string;
  judul: string;
  deskripsi: string;
  urutan: number;
  aktif: boolean;
}

export interface LangkahPenggunaan {
  id: string;
  nomor: number;
  judul: string;
  deskripsi: string;
}

export interface FAQItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  aktif: boolean;
}

export interface TestimoniItem {
  id: string;
  nama: string;
  jabatan: string;
  instansi: string;
  isi: string;
  foto_url?: string;
  aktif: boolean;
}

export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  kategori: string;
  tanggal: string;
  dipublikasi: boolean;
}

export interface MenuNavigasi {
  id: string;
  label: string;
  path: string;
  role_akses: 'semua' | 'super_admin' | 'admin';
  urutan: number;
  aktif: boolean;
}
