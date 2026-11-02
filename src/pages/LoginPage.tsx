import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { const user = await login(email, password); navigate(user.role === 'mahasiswa' ? '/mahasiswa' : '/admin'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal masuk.'); }
    finally { setSaving(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-6">
    <form onSubmit={submit} className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg space-y-5">
      <h1 className="text-2xl font-bold">Masuk ke SMART PKL</h1>
      <p className="text-sm text-slate-500">Gunakan nama login atau email dan kata sandi akun yang terdaftar. Hak akses mengikuti akun Anda.</p>
      {error && <div role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">{error}</div>}
      <label className="block text-sm">Username / Email
        <input type="text" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="block w-full border rounded-lg p-3 mt-1 dark:bg-slate-800" />
      </label>
      <label className="block text-sm">Kata sandi
        <input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block w-full border rounded-lg p-3 mt-1 dark:bg-slate-800" />
      </label>
      <button disabled={saving} className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50">{saving ? 'Memeriksa akun...' : 'Masuk'}</button>
      <Link to="/" className="block text-center text-sm text-blue-600">Kembali ke halaman peringkat</Link>
    </form>
  </main>;
};
