import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import { SiteSettings } from '../../types';

interface FooterProps {
  settings: SiteSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const brandName = settings?.nama_situs || 'SMART PKL';
  const companyHost = settings?.nama_perusahaan_host || 'PT Seven Inc.';
  const footerText = settings?.teks_footer || '© 2026 PT Seven Inc. Hak cipta dilindungi undang-undang.';

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight leading-none">
                  {brandName}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {companyHost}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {settings?.deskripsi_singkat ||
                'Sistem Penunjang Keputusan berbasis metode SMART untuk rekomendasi dan penempatan tempat PKL mahasiswa yang objektif, transparan, dan teruji secara ilmiah.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Penilaian &amp; Peringkat PKL
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Dashboard Admin (Founder &amp; HRD)
                </Link>
              </li>
              <li>
                <a href="/data/mahasiswa_pkl.csv" download="data_mahasiswa_pkl.csv" className="hover:text-white transition-colors">
                  Unduh Berkas CSV Mahasiswa
                </a>
              </li>
              <li>
                <a href="/data/mahasiswa_pkl.json" download="data_mahasiswa_pkl.json" className="hover:text-white transition-colors">
                  Unduh Berkas JSON Mahasiswa
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase">
              Hubungi Kami
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{settings?.alamat_kontak || 'Jl. Ringroad Utara No. 7, Sleman, D.I. Yogyakarta'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{settings?.email_kontak || 'pkl-support@seveninc.co.id'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{settings?.telepon_kontak || '+62 821-3456-7890'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{footerText}</p>
          <div className="flex gap-6">
            <span>Metode SMART</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL & Supabase</span>
            <span aria-hidden="true">·</span>
            <span>Versi 2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
