import { PengajuanPKL, StatusPengajuan } from '../types';
import { database, checkError } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';
export const pengajuanService = {
  async getSemuaPengajuan(): Promise<PengajuanPKL[]> {
    const { data, error } = await database().from('pengajuan_pkl').select('*, alternatif(*), mahasiswa:app_profiles(*)').order('created_at', { ascending: false });
    checkError(error); return data ?? [];
  },
  async getPengajuanSaya(userId: string): Promise<PengajuanPKL[]> {
    const { data, error } = await database().from('pengajuan_pkl').select('*, alternatif(*)').eq('user_id', userId).order('created_at', { ascending: false });
    checkError(error); return data ?? [];
  },
  async ajukanPKL({ userId, alternatifId, periodeId, skorSmart }: { userId: string; alternatifId: string; periodeId?: string; skorSmart?: number }): Promise<PengajuanPKL> {
    const { data, error } = await database().from('pengajuan_pkl').insert({
      user_id:userId, alternatif_id:alternatifId, periode_id:periodeId || null, skor_smart:skorSmart, status:'diajukan',
    }).select().single();
    checkError(error); if (!data) throw new Error('Pengajuan belum tersimpan.'); return data;
  },
  async updateStatusPengajuan(id: string, status: StatusPengajuan, catatan_admin: string): Promise<PengajuanPKL> {
    const { data, error } = await database().from('pengajuan_pkl').update({status,catatan_admin}).eq('id',id).select().single();
    checkError(error); if (!data) throw new Error('Status pengajuan belum tersimpan.');
    notifyMutation('Status pengajuan berhasil diperbarui di Supabase.');
    return data;
  },
};
