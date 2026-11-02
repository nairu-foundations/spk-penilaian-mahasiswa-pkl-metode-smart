import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useQuery } from '../../hooks/useData';
import { database, checkError } from '../../lib/database';

export const AdminPengaturanAkun: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [nama, setNama] = useState(user.nama);
  const [noHp, setNoHp] = useState(user.no_hp ?? '');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const { error: connectionError, loading } = useQuery(async () => {
    const { error } = await database().from('kriteria_smart').select('id').limit(1);
    checkError(error); return true;
  });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice('');
    try { await authService.updateProfile({...user,nama,no_hp:noHp}); await refreshUser(); setNotice('Pengaturan akun tersimpan di Supabase.'); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Gagal menyimpan akun.'); }
    finally { setSaving(false); }
  };
  return <div className="max-w-2xl space-y-6">
    <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
    <p className="text-sm">{loading ? 'Memeriksa koneksi...' : connectionError ? connectionError : 'Terhubung ke Supabase'}</p>
    {notice && <p role="status" className="text-emerald-700">{notice}</p>}
    <form onSubmit={submit} className="p-6 rounded-xl bg-white dark:bg-slate-900 border space-y-4">
      <label className="block text-sm">Nama tampilan<input required value={nama} onChange={e=>setNama(e.target.value)} className="block w-full border p-3 rounded-lg mt-1 dark:bg-slate-800" /></label>
      <label className="block text-sm">Nomor telepon<input value={noHp} onChange={e=>setNoHp(e.target.value)} className="block w-full border p-3 rounded-lg mt-1 dark:bg-slate-800" /></label>
      <label className="block text-sm">Email login<input readOnly value={user.email} className="block w-full border p-3 rounded-lg mt-1 dark:bg-slate-800 text-slate-500" /></label>
      <button disabled={saving} className="bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Akun'}</button>
    </form>
  </div>;
};
