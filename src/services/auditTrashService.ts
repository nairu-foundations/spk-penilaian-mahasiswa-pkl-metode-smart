import type { AuditLog } from '../types';
import { database, checkError } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';
export interface AuditTrashItem { id: string; archived_at: string; reason: 'overflow' | 'manual'; log: AuditLog }
export const auditTrashService = {
 async list(page = 1): Promise<{ items: AuditTrashItem[]; total: number }> {
   const start = (Math.max(1, page) - 1) * 20;
   const { data, error, count } = await database().from('audit_log_trash').select('id,archived_at,reason,log', { count: 'exact' }).order('archived_at', { ascending: false }).order('id', { ascending: false }).range(start, start + 19);
   checkError(error); return { items: data ?? [], total: count ?? 0 };
 },
 async archive(id?: string): Promise<number> {
   const { data, error } = await database().rpc('archive_audit_logs', id ? { p_id: id } : {});
   checkError(error); if (!Number.isInteger(data) || data < 0) throw new Error('Pemindahan log belum dikonfirmasi.');
   notifyMutation('Audit log dipindahkan ke Tempat Sampah.'); return data;
 },
 async restore(id: string): Promise<void> {
   const { data, error } = await database().rpc('restore_audit_log', { p_id: id });
   checkError(error); if (data !== true) throw new Error('Pemulihan log belum dikonfirmasi.');
   notifyMutation('Audit log dipulihkan. Log aktif tetap dibatasi 20 catatan.');
 },
 async purge(id: string): Promise<void> {
   const { data, error } = await database().rpc('purge_audit_log', { p_id: id });
   checkError(error); if (data !== true) throw new Error('Penghapusan permanen belum dikonfirmasi.');
   notifyMutation('Audit log di Tempat Sampah dihapus permanen.');
 },
};
export function saveAuditFile(logs: AuditLog[]) {
 const url = URL.createObjectURL(new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' }));
 const link = document.createElement('a'); link.href = url; link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`; link.click();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
}
