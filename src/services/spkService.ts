import { Alternatif, HasilPerhitungan, HasilDetail, Kriteria, NilaiAlternatif, PeriodePKL, SkalaNilai } from '../types';
import { database, checkError, readRows, saveRow, deleteRow } from '../lib/database';
import { INITIAL_KRITERIA } from './initialData';
import { notifyMutation } from '../lib/mutationFeedback';

export const spkService = {
  async getKriteria(): Promise<Kriteria[]> { return readRows('kriteria_smart', 'urutan'); },
  async resetKriteria(): Promise<Kriteria[]> {
    const rows = INITIAL_KRITERIA.map(({ id, ...row }) => ({ ...row, bobot_normal: row.bobot_awal / 100 }));
    const { data, error } = await database().from('kriteria_smart').upsert(rows, { onConflict: 'kode' }).select();
    checkError(error);
    if (data?.length !== rows.length) throw new Error('Kriteria belum tersimpan seluruhnya.');
    notifyMutation();
    return this.getKriteria();
  },
  async saveKriteria(row: Kriteria): Promise<Kriteria> { return saveRow('kriteria_smart', row); },
  async deleteKriteria(id: string) { return deleteRow('kriteria_smart', id); },
  async getAlternatif(): Promise<Alternatif[]> { return readRows('alternatif', 'kode'); },
  async saveAlternatif(row: Alternatif): Promise<Alternatif> { return saveRow('alternatif', row); },
  async deleteAlternatif(id: string) { return deleteRow('alternatif', id); },
  async getSkalaNilai(): Promise<SkalaNilai[]> { return readRows('skala_nilai', 'nilai'); },
  async getNilaiMatrix(): Promise<NilaiAlternatif[]> { return readRows('nilai_alternatif'); },
  async updateNilaiCell(alternatifId: string, kriteriaId: string, nilai: number): Promise<void> {
    const { data, error } = await database().from('nilai_alternatif').upsert({
      alternatif_id: alternatifId, kriteria_id: kriteriaId, nilai,
    }, { onConflict: 'alternatif_id,kriteria_id' }).select();
    checkError(error);
    if (!data?.length) throw new Error('Nilai belum tersimpan.');
    notifyMutation();
  },
  async getPeriode(): Promise<PeriodePKL[]> { return readRows('periode_pkl', 'tanggal_mulai'); },
  async savePeriode(row: PeriodePKL): Promise<PeriodePKL> { return saveRow('periode_pkl', row); },
  async simpanHasil({ userId, bobotSnapshot, ranking, catatan }: {
    userId: string; bobotSnapshot: Record<string, number>; ranking: HasilDetail[]; catatan?: string;
  }): Promise<HasilPerhitungan> {
    const { data, error } = await database().from('hasil_perhitungan').insert({
      user_id: userId, bobot_snapshot: bobotSnapshot, ranking, catatan,
    }).select().single();
    checkError(error);
    if (!data) throw new Error('Hasil perhitungan belum tersimpan.');
    notifyMutation();
    return data;
  },
  async getRiwayatHasil(userId: string): Promise<HasilPerhitungan[]> {
    const { data, error } = await database().from('hasil_perhitungan').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    checkError(error); return data ?? [];
  },
  async getSemuaHasil(): Promise<HasilPerhitungan[]> { return readRows('hasil_perhitungan', 'created_at'); },
};
