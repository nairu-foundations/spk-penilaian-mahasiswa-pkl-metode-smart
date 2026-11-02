import React, { useState } from 'react';
import { Save, Check, Database, Shield } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export const AdminPengaturanAkun: React.FC = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Akun &amp; Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dashboard &gt; Pengaturan Akun
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan akun berhasil disimpan!</span>
        </div>
      )}

      {/* Database Connection Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Status Database PostgreSQL (Supabase)</span>
        </h3>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Koneksi Supabase:</span>
            <span
              className={`font-semibold ${
                isSupabaseConfigured ? 'text-emerald-600' : 'text-blue-600'
              }`}
            >
              {isSupabaseConfigured
                ? 'Terhubung ke Cloud Database'
                : 'Mode Simulasi Real-Time (LocalStorage Aktif)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Skrip migrasi database lengkap tersedia pada file <code>schema.sql</code>,{' '}
            <code>seed.sql</code>, dan <code>database_spk_seveninc.sql</code> di direktori root proyek.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href="/data/database_spk_seveninc.sql"
              download="database_spk_seveninc.sql"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Database className="w-3.5 h-3.5" /> Unduh File Database PostgreSQL (.sql)
            </a>
          </div>
        </div>
      </div>

      {/* Account Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Profil Akun HRD / Administrator</span>
        </h3>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nama Pengguna
          </label>
          <input
            type="text"
            defaultValue="HRD PT Seven Inc."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email Admin
          </label>
          <input
            type="email"
            defaultValue="hrd@seveninc.co.id"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Akun</span>
          </button>
        </div>
      </form>
    </div>
  );
};
