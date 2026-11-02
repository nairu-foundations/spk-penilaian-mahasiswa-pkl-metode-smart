import React, { useState } from 'react';
import { Save, Check, Globe } from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { contentService } from '../../services/contentService';
import { SiteSettings, HeroSection } from '../../types';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminCMSKonten: React.FC = () => {
  const { error: settingsError, data: settings, loading: loadingSet, refetch: refetchSet } = useQuery(() =>
    contentService.getSiteSettings()
  );
  const { error: heroError, data: hero, loading: loadingHero, refetch: refetchHero } = useQuery(() =>
    contentService.getHero()
  );

  const [activeTab, setActiveTab] = useState<'site' | 'hero'>('site');
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);
  const [localHero, setLocalHero] = useState<HeroSection | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    if (settings && !localSettings) setLocalSettings(settings);
  }, [settings, localSettings]);

  React.useEffect(() => {
    if (hero && !localHero) setLocalHero(hero);
  }, [hero, localHero]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!localSettings) return;
      await contentService.updateSiteSettings(localSettings);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
      await refetchSet();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.');
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!localHero) return;
      await contentService.updateHero(localHero);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
      await refetchHero();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.');
    }
  };

  if (settingsError || heroError) return <div role="alert" className="p-4 text-red-700">{settingsError || heroError}</div>;

  if (loadingSet || loadingHero || !localSettings || !localHero) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            CMS Konten Website Dinamis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; CMS Konten Web
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
            <Check className="w-4 h-4" /> Perubahan berhasil disimpan ke database!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('site')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'site'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Informasi Situs &amp; Kontak
        </button>
        <button
          onClick={() => setActiveTab('hero')}
          className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'hero'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hero Banner &amp; Headline
        </button>
      </div>

      {/* Tab 1: Site Settings */}
      {activeTab === 'site' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Situs (Brand Title)
              </label>
              <input
                type="text"
                value={localSettings.nama_situs}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, nama_situs: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Perusahaan / Host Instansi
              </label>
              <input
                type="text"
                value={localSettings.nama_perusahaan_host}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, nama_perusahaan_host: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tagline Situs
            </label>
            <input
              type="text"
              value={localSettings.tagline}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, tagline: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Singkat (Tentang)
            </label>
            <textarea
              rows={2}
              value={localSettings.deskripsi_singkat}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, deskripsi_singkat: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Kontak
              </label>
              <input
                type="email"
                value={localSettings.email_kontak}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, email_kontak: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={localSettings.telepon_kontak}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, telepon_kontak: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              value={localSettings.alamat_kontak}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, alamat_kontak: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kutipan Inspiratif (Login Page Quote)
            </label>
            <input
              type="text"
              value={localSettings.quote_login}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, quote_login: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Hero Section */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveHero} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Judul Utama Hero (Headline)
            </label>
            <input
              type="text"
              value={localHero.judul}
              onChange={(e) => setLocalHero({ ...localHero, judul: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subjudul Hero (Deskripsi)
            </label>
            <textarea
              rows={3}
              value={localHero.subjudul}
              onChange={(e) => setLocalHero({ ...localHero, subjudul: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Teks Tombol Utama
              </label>
              <input
                type="text"
                value={localHero.teks_tombol_utama}
                onChange={(e) =>
                  setLocalHero({ ...localHero, teks_tombol_utama: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Teks Tombol Sekunder
              </label>
              <input
                type="text"
                value={localHero.teks_tombol_sekunder}
                onChange={(e) =>
                  setLocalHero({ ...localHero, teks_tombol_sekunder: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Save className="w-4 h-4" /> Simpan Konten Hero
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
