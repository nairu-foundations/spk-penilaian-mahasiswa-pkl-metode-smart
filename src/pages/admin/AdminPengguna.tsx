import React from 'react';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';

export const AdminPengguna: React.FC = () => {
  const { data, error, loading } = useQuery(() => authService.listUsers());
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Pengguna Sistem</h1>
    <p className="text-sm text-slate-500">Akun dan hak akses yang terdaftar di database.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p>Memuat pengguna...</p> : <table className="w-full text-left text-sm bg-white dark:bg-slate-900 rounded-lg">
      <thead><tr><th className="p-3">Nama</th><th>Email</th><th>Hak akses</th></tr></thead>
      <tbody>{data?.map(user=><tr key={user.id}><td className="p-3">{user.nama}</td><td>{user.email}</td><td>{user.role}</td></tr>)}</tbody>
    </table>}
  </div>;
};
