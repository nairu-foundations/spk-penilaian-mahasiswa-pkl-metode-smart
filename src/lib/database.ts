import { supabase } from './supabaseClient';

export function database() {
  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi pada deployment ini.');
  return supabase;
}

export function checkError(error: { message: string } | null) {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

export async function readRows<T>(table: string, order?: string): Promise<T[]> {
  let query = database().from(table).select('*');
  if (order) query = query.order(order);
  const { data, error } = await query;
  checkError(error);
  return data ?? [];
}

export async function saveRow<T extends { id: string }>(table: string, row: T): Promise<T> {
  const { data, error } = await database().from(table)
    .upsert({ ...row, id: row.id || crypto.randomUUID() }).select().single();
  checkError(error);
  if (!data) throw new Error('Database belum mengonfirmasi penyimpanan.');
  return data;
}

export async function deleteRow(table: string, id: string) {
  const { data, error } = await database().from(table).delete().eq('id', id).select('id');
  checkError(error);
  if (!data?.length) throw new Error('Data tidak terhapus. Muat ulang halaman dan periksa hak akses akun.');
  return true;
}
