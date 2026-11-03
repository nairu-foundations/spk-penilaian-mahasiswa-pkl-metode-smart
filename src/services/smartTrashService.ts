import { database, checkError } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';

export interface SmartTrashItem {
  id: string;
  kind: 'dataset' | 'history' | 'student';
  label: string;
  deleted_at: string;
  student_count: number;
  history_count: number;
}
export const smartTrashService = {
  async list(): Promise<SmartTrashItem[]> {
    const { data, error } = await database().from('smart_trash')
      .select('id,kind,label,deleted_at,student_count,history_count').is('restored_at', null)
      .order('deleted_at', { ascending: false });
    checkError(error);
    return data ?? [];
  },
  async restore(id: string, historyOnly = false): Promise<{ students: number; history: number }> {
    const { data, error } = await database().rpc('restore_smart_trash', { p_trash_id: id, p_history_only: historyOnly });
    checkError(error);
    if (!data || !Number.isInteger(data.students) || !Number.isInteger(data.history) || data.students < 0 || data.history < 0) throw new Error('Pemulihan belum dikonfirmasi oleh Supabase.');
    notifyMutation('Data berhasil dipulihkan dari Tempat Sampah.');
      return data;
  },
  async purge(id: string): Promise<void> {
    const { data, error } = await database().rpc('purge_smart_trash', { p_trash_id: id });
    checkError(error);
    if (data !== true) throw new Error('Penghapusan permanen belum dikonfirmasi oleh Supabase.');
    notifyMutation('Data Tempat Sampah dihapus permanen.');
  },
};
