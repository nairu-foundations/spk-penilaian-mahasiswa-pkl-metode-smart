import {
  FAQItem,
  FiturItem,
  HeroSection,
  LangkahPenggunaan,
  MenuNavigasi,
  PengumumanItem,
  SiteSettings,
  TestimoniItem,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  INITIAL_FAQ,
  INITIAL_FITUR,
  INITIAL_HERO,
  INITIAL_LANGKAH,
  INITIAL_MENU,
  INITIAL_PENGUMUMAN,
  INITIAL_SITE_SETTINGS,
  INITIAL_TESTIMONI,
} from './initialData';

// Local storage helper
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`spk_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`spk_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

export const contentService = {
  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (!error && data && data.length > 0) {
        const obj: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => {
          obj[row.key] = row.value;
        });
        return { ...INITIAL_SITE_SETTINGS, ...obj };
      }
    }
    return getStored('site_settings', INITIAL_SITE_SETTINGS);
  },

  async updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    if (isSupabaseConfigured && supabase) {
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        tipe: 'text',
      }));
      await supabase.from('site_settings').upsert(rows);
    }
    setStored('site_settings', settings);
    return settings;
  },

  // Hero Section
  async getHero(): Promise<HeroSection> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('hero_section').select('*').limit(1).single();
      if (!error && data) return data;
    }
    return getStored('hero', INITIAL_HERO);
  },

  async updateHero(hero: HeroSection): Promise<HeroSection> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('hero_section').upsert(hero);
    }
    setStored('hero', hero);
    return hero;
  },

  // Fitur
  async getFitur(): Promise<FiturItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('fitur').select('*').order('urutan', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('fitur', INITIAL_FITUR);
  },

  async saveFiturList(list: FiturItem[]): Promise<FiturItem[]> {
    setStored('fitur', list);
    return list;
  },

  // Langkah Penggunaan
  async getLangkah(): Promise<LangkahPenggunaan[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('langkah_penggunaan').select('*').order('nomor', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('langkah', INITIAL_LANGKAH);
  },

  async saveLangkahList(list: LangkahPenggunaan[]): Promise<LangkahPenggunaan[]> {
    setStored('langkah', list);
    return list;
  },

  // FAQ
  async getFaq(): Promise<FAQItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('faq').select('*').order('urutan', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('faq', INITIAL_FAQ);
  },

  async saveFaqList(list: FAQItem[]): Promise<FAQItem[]> {
    setStored('faq', list);
    return list;
  },

  // Testimoni
  async getTestimoni(): Promise<TestimoniItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('testimoni').select('*');
      if (!error && data) return data;
    }
    return getStored('testimoni', INITIAL_TESTIMONI);
  },

  async saveTestimoniList(list: TestimoniItem[]): Promise<TestimoniItem[]> {
    setStored('testimoni', list);
    return list;
  },

  // Pengumuman
  async getPengumuman(): Promise<PengumumanItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getStored('pengumuman', INITIAL_PENGUMUMAN);
  },

  async savePengumumanList(list: PengumumanItem[]): Promise<PengumumanItem[]> {
    setStored('pengumuman', list);
    return list;
  },

  // Menu Navigasi
  async getMenu(): Promise<MenuNavigasi[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('menu_navigasi').select('*').order('urutan', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('menu', INITIAL_MENU);
  },

  async saveMenuList(list: MenuNavigasi[]): Promise<MenuNavigasi[]> {
    setStored('menu', list);
    return list;
  },
};
