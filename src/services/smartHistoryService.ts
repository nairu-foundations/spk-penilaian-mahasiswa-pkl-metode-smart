import { database, checkError } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';
import type { SMARTMahasiswaResult } from '../utils/smart';

// Reuse the existing cloud calculation archive. catatan stores a versioned snapshot;
// the prefix isolates student SMART runs from legacy placement calculations.
export const SMART_HISTORY_PREFIX = 'SMART_MAHASISWA_V1:';
const historyPattern = SMART_HISTORY_PREFIX.replace(/_/g, '\\_') + '%';
export interface SmartRun {
  id: string;
  created_at: string;
  periode: string;
  source: string;
  result: SMARTMahasiswaResult;
}
interface StoredRun { id: string; created_at: string; catatan: string }
export function decodeSmartRun(row: StoredRun): SmartRun {
  if (!row.catatan.startsWith(SMART_HISTORY_PREFIX)) throw new Error('Format arsip SMART tidak dikenali.');
  const snapshot = JSON.parse(row.catatan.slice(SMART_HISTORY_PREFIX.length));
  if (typeof snapshot.periode !== 'string' || typeof snapshot.source !== 'string' || !Array.isArray(snapshot.result?.ranking) || !Array.isArray(snapshot.result?.matriksKeputusan) || !Array.isArray(snapshot.result?.kriteriaList) || !snapshot.result?.bobotNormal) {
    throw new Error('Arsip SMART tidak lengkap.');
  }
  return { ...snapshot, id: row.id, created_at: row.created_at };
}

export interface SmartClearResult { history: number; students: number; scores: number; cleared_all: boolean; trash_id?: string | null }
const notifyClear = () => {
  notifyMutation('Data SMART dipindahkan ke Tempat Sampah Supabase.');
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('spk:refresh'));
};
const validateClear = (data: SmartClearResult) => {
  if (!data || typeof data.cleared_all !== 'boolean' || !(['history', 'students', 'scores'] as const).every(key => Number.isInteger(data[key]) && data[key] >= 0)) throw new Error('Supabase belum mengonfirmasi penghapusan data SMART.');
  return data;
};
export const smartHistoryService = {
  async clearAll(): Promise<SmartClearResult> {
    const { data, error } = await database().rpc('clear_mahasiswa_smart_data');
    checkError(error);
    const confirmed = validateClear(data);
    notifyClear();
    return confirmed;
  },
  async list(): Promise<SmartRun[]> {
    const { data, error } = await database().from('hasil_perhitungan').select('id,created_at,catatan')
      .like('catatan', historyPattern).order('created_at', { ascending: false }).order('id', { ascending: false });
    checkError(error);
    return (data ?? []).map(decodeSmartRun);
  },
  async save(input: Pick<SmartRun, 'periode' | 'source' | 'result'>): Promise<SmartRun> {
    const db = database();
    const { data: auth, error: authError } = await db.auth.getUser();
    checkError(authError);
    if (!auth.user) throw new Error('Login admin diperlukan untuk menyimpan riwayat SMART.');
    const { data, error } = await db.from('hasil_perhitungan').insert({
      user_id: auth.user.id,
      bobot_snapshot: input.result.bobotNormal,
      ranking: input.result.ranking,
      catatan: SMART_HISTORY_PREFIX + JSON.stringify(input),
    }).select('id,created_at,catatan').single();
    checkError(error);
    if (!data) throw new Error('Riwayat perhitungan belum dikonfirmasi oleh Supabase.');
    return decodeSmartRun(data);
  },
  async remove(id: string): Promise<SmartClearResult> {
    if (!id) throw new Error('Pilih riwayat atau gunakan Hapus Semua Data SMART.');
    const { data, error } = await database().rpc('clear_mahasiswa_smart_data', { p_history_id: id });
    checkError(error);
    const confirmed = validateClear(data);
    notifyClear();
    return confirmed;
  },
};

