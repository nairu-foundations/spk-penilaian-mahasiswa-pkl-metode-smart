import { PengajuanPKL, StatusPengajuan } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { INITIAL_PENGAJUAN } from './initialData';

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`spk_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`spk_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

export const pengajuanService = {
  async getSemuaPengajuan(): Promise<PengajuanPKL[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pengajuan_pkl')
        .select('*, alternatif(*), mahasiswa:profiles(*)');
      if (!error && data) return data;
    }
    return getStored('pengajuan', INITIAL_PENGAJUAN);
  },

  async getPengajuanSaya(userId: string): Promise<PengajuanPKL[]> {
    const all = await this.getSemuaPengajuan();
    return all.filter((p) => p.user_id === userId);
  },

  async ajukanPKL({
    userId,
    alternatifId,
    periodeId,
    skorSmart,
  }: {
    userId: string;
    alternatifId: string;
    periodeId?: string;
    skorSmart?: number;
  }): Promise<PengajuanPKL> {
    const all = await this.getSemuaPengajuan();

    // Cek apakah mahasiswa sudah memiliki pengajuan yang aktif
    const existingActive = all.find(
      (p) => p.user_id === userId && p.status !== 'ditolak'
    );
    if (existingActive) {
      throw new Error(
        'Anda sudah memiliki pengajuan tempat PKL yang sedang berjalan (Status: ' +
          existingActive.status +
          '). Silakan tunggu keputusan admin.'
      );
    }

    const newPengajuan: PengajuanPKL = {
      id: `peng-${Date.now()}`,
      user_id: userId,
      alternatif_id: alternatifId,
      periode_id: periodeId || 'per-1',
      status: 'diajukan',
      catatan_admin: 'Menunggu peninjauan berkas oleh admin/koordinator.',
      created_at: new Date().toISOString(),
      skor_smart: skorSmart,
    };

    const updated = [newPengajuan, ...all];
    setStored('pengajuan', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('pengajuan_pkl').insert({
        user_id: userId,
        alternatif_id: alternatifId,
        periode_id: periodeId,
        status: 'diajukan',
        skor_smart: skorSmart,
      });
    }

    return newPengajuan;
  },

  async updateStatusPengajuan(
    pengajuanId: string,
    status: StatusPengajuan,
    catatanAdmin: string
  ): Promise<PengajuanPKL> {
    const all = await this.getSemuaPengajuan();
    const idx = all.findIndex((p) => p.id === pengajuanId);
    if (idx === -1) {
      throw new Error('Data pengajuan tidak ditemukan.');
    }

    const updatedItem = {
      ...all[idx],
      status,
      catatan_admin: catatanAdmin,
    };
    all[idx] = updatedItem;
    setStored('pengajuan', all);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('pengajuan_pkl')
        .update({
          status,
          catatan_admin: catatanAdmin,
        })
        .eq('id', pengajuanId);
    }

    return updatedItem;
  },
};
