import { MahasiswaPKL } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { notifyMutation } from '../lib/mutationFeedback';
import { nilaiDariRekap } from '../utils/penilaianBulanan';

const requireDatabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, lalu jalankan ulang server.');
  }
  return supabase;
};

const databaseError = (message: string) => new Error(
  `Data belum tersimpan atau belum dapat dimuat dari Supabase: ${message}. Periksa koneksi, izin tabel, dan migrasi migrations/20261103_shared_mahasiswa.sql.`
);

export const mahasiswaService = {
  async list(): Promise<MahasiswaPKL[]> {
    const { data, error } = await requireDatabase().from('mahasiswa_pkl_app').select('*').order('kode_alternatif');
    if (error) throw databaseError(error.message);
    return data ?? [];
  },

  async saveMany(input: MahasiswaPKL[], replace = false): Promise<MahasiswaPKL[]> {
    const client = requireDatabase();
    const current = await this.list();
    const emails = new Set<string>();
    const ids = new Set<string>();
    const retained = replace ? current.filter(row => input.some(item => item.id === row.id || item.email.trim().toLowerCase() === row.email.toLowerCase())) : current;
    const codes = new Set(retained.map((m) => m.kode_alternatif));
    let nextCode = Math.max(0, ...retained.map((m) => Number(m.kode_alternatif?.match(/^A(\d+)$/)?.[1] ?? 0))) + 1;
    const rows = input.map((item) => {
      const email = item.email.trim().toLowerCase();
      if (!email || !item.nama.trim() || emails.has(email)) {
        throw new Error('Nama dan email wajib diisi. Email dalam satu impor tidak boleh berulang.');
      }
      emails.add(email);
      const existing = current.find((m) => m.id === item.id || m.email.toLowerCase() === email);
      const merged = { ...existing, ...Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)) } as MahasiswaPKL;
      const id = existing?.id ?? crypto.randomUUID();
      if (ids.has(id)) throw new Error('Mahasiswa yang sama tidak boleh berulang dalam satu impor.');
      ids.add(id);
      let code = existing?.kode_alternatif ?? item.kode_alternatif;
      if (!code || (!existing && codes.has(code))) code = `A${nextCode++}`;
      codes.add(code);
      const scores = merged.rekap_bulanan ? nilaiDariRekap(merged.rekap_bulanan) : merged.nilai_kriteria ?? {};
      if (merged.rekap_bulanan && item.nilai_kriteria && Object.entries(scores).some(([code, value]) => Math.abs((item.nilai_kriteria?.[code] ?? value) - value) > 0.0001)) {
        throw new Error('Nilai mahasiswa ini berasal dari rekap bulanan. Gunakan Ubah Rekap pada Input Penilaian untuk memperbarui jumlah hari atau tugas.');
      }
      if (Object.values(scores).some((v) => !Number.isFinite(v) || v < 0 || v > 100)) {
        throw new Error(`Nilai ${item.nama} harus berupa angka antara 0 dan 100.`);
      }
      // Only send columns in the database schema; computed ranking is derived by SMART.
      return {
        id, kode_alternatif: code, nama: merged.nama.trim(), email,
        nim: merged.nim ?? '', institusi: merged.institusi ?? 'PT Seven Inc.',
        bagian: merged.bagian, periode: merged.periode,
        tanggal_mulai: merged.tanggal_mulai, tanggal_selesai: merged.tanggal_selesai,
        no_hp: merged.no_hp ?? '', status: merged.status,
        nilai_kriteria: scores, utility: merged.utility ?? {},
        skor_akhir_smart: merged.skor_akhir_smart ?? 0,
        nilai_skala_100: merged.nilai_skala_100 ?? 0,
        peringkat: merged.peringkat ?? 0, keterangan_nilai: merged.keterangan_nilai ?? 'Cukup',
        pembimbing_industri: merged.pembimbing_industri ?? '',
        catatan_evaluasi: merged.catatan_evaluasi ?? '',
        rekap_bulanan: merged.rekap_bulanan ?? null,
      };
    });
    const { data, error } = await client.rpc('save_mahasiswa_pkl_batch', {
      p_rows: rows, p_replace: replace,
    });
    if (error) throw databaseError(error.message);
    if (!data || data.length !== rows.length) {
      throw new Error('Supabase belum mengonfirmasi seluruh data tersimpan. Periksa izin baca/tulis tabel mahasiswa_pkl.');
    }
    notifyMutation();
    return data;
  },

  async remove(id: string): Promise<void> {
    const { data, error } = await requireDatabase().from('mahasiswa_pkl').delete().eq('id', id).select('id');
    if (error) throw databaseError(error.message);
    if (!data?.length) throw new Error('Mahasiswa tidak terhapus. Periksa izin database atau muat ulang data.');
    notifyMutation('Data mahasiswa berhasil dihapus dari Supabase.');
  },
};
