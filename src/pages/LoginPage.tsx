import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Check, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'mahasiswa' ? '/mahasiswa' : '/admin', { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal masuk. Silakan coba kembali.'); }
    finally { setSaving(false); }
  };
  return (
    <main className="login-page">
      <div className="login-card">
      <section className="login-story" aria-label="Tentang SMART PKL">
        <Link to="/" className="login-brand"><span className="login-brand-icon"><GraduationCap size={28} /></span><span>SMART PKL<small>PT Seven Inc.</small></span></Link>
        <div className="login-story-content">
          <span className="login-eyebrow"><Sparkles size={15} /> SETIAP POTENSI, BERARTI.</span>
          <h1>Langkah kecil.<br />Potensi <span>besar.</span></h1>
          <p>Kelola penilaian PKL dengan lebih terarah. Dari proses belajar hingga pencapaian terbaik, semuanya dalam satu tempat.</p>
          <div className="login-insight">
            <div className="login-insight-header"><span className="login-chart-icon"><BarChart3 size={21} /></span><div>Penilaian yang terukur<small>Didukung metode SMART</small></div><span className="login-live-dot" /></div>
            <div className="login-bars" aria-hidden="true">
              {[['Kehadiran', '88%'], ['Ketepatan waktu', '72%'], ['Penyelesaian tugas', '94%']].map(([label, width], index) => <div className="login-bar-row" key={label}><span>{label}</span><div><i style={{ width, animationDelay: `${index * 140}ms` }} /></div><Check size={14} /></div>)}
            </div>
            <p className="login-insight-note">Tiga kriteria. Satu penilaian yang lebih objektif.</p>
          </div>
          <div className="login-story-benefits"><span><Check size={15} /> Penilaian terpusat</span><span><Check size={15} /> Peringkat transparan</span></div>
        </div>
        <p className="login-story-footer">Tumbuh bersama. Berprestasi bersama.</p>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <Link to="/" className="login-back"><ArrowLeft size={17} /> Kembali ke beranda</Link>
        <div className="login-form-wrap">
          <span className="login-welcome-icon"><GraduationCap size={30} /></span>
          <p className="login-form-eyebrow">PORTAL SMART PKL</p>
          <h2 id="login-title">Selamat datang kembali<span>.</span></h2>
          <p className="login-form-description">Masuk untuk melanjutkan perjalanan Anda.</p>
          <form onSubmit={submit} className="login-form" aria-busy={saving}>
            {error && <div role="alert" id="login-error" className="login-error">{error}</div>}
            <div>
              <label htmlFor="login-username">Username atau email</label>
              <div className="login-input-wrap"><UserRound size={19} aria-hidden="true" /><input id="login-username" name="username" type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Masukkan username atau email" value={email} onChange={e => setEmail(e.target.value)} disabled={saving} aria-describedby={error ? 'login-error' : undefined} /></div>
            </div>
            <div>
              <label htmlFor="login-password">Kata sandi</label>
              <div className="login-input-wrap"><LockKeyhole size={19} aria-hidden="true" /><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Masukkan kata sandi Anda" value={password} onChange={e => setPassword(e.target.value)} onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))} onKeyDown={e => setCapsLock(e.getModifierState('CapsLock'))} onBlur={() => setCapsLock(false)} disabled={saving} aria-describedby={[capsLock && 'login-caps', error && 'login-error'].filter(Boolean).join(' ') || undefined} /><button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} disabled={saving}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
              {capsLock && <p id="login-caps" className="login-caps" role="status">Caps Lock sedang aktif.</p>}
            </div>
            <button type="submit" className="login-submit" disabled={saving}>{saving ? <><LoaderCircle size={20} className="animate-spin" /> Memeriksa akun...</> : <>Masuk ke akun <ArrowRight size={19} /></>}</button>
          </form>
          <div className="login-access-note"><ShieldCheck size={21} /><p>Satu pintu untuk semua peran.<span>Dashboard menyesuaikan hak akses akun Anda.</span></p></div>
          <p className="login-help">Belum memiliki akun? Hubungi admin atau HRD PT Seven Inc.</p>
        </div>
        <footer className="login-form-footer">© {new Date().getFullYear()} PT Seven Inc. <span>SMART PKL</span></footer>
      </section>
      </div>
    </main>
  );
};
