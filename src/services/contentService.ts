import { FAQItem, FiturItem, HeroSection, LangkahPenggunaan, MenuNavigasi, PengumumanItem, SiteSettings, TestimoniItem } from '../types';
import { database, checkError } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';

async function getDocument<T>(key: string): Promise<T> {
  const { data, error } = await database().from('site_settings').select('value').eq('key', `cms_${key}`).single();
  checkError(error);
  if (!data) throw new Error('Konten belum tersedia di database.');
  return JSON.parse(data.value);
}
async function saveDocument<T>(key: string, value: T): Promise<T> {
  const { data, error } = await database().from('site_settings').upsert({key: `cms_${key}`, value: JSON.stringify(value), tipe: 'json'}).select('key');
  checkError(error);
  if (data?.length !== 1) throw new Error('Konten belum tersimpan.');
  notifyMutation();
  return value;
}
export const contentService = {
  async getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await database().from('site_settings').select('key,value');
    checkError(error);
    return Object.fromEntries((data ?? []).filter(row => !row.key.startsWith('cms_')).map(row => [row.key,row.value])) as unknown as SiteSettings;
  },
  async updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    const rows = Object.entries(settings).filter(([,value])=>value !== undefined).map(([key,value])=>({key,value:String(value),tipe:'text'}));
    const { data, error } = await database().from('site_settings').upsert(rows).select('key');
    checkError(error);
    if (data?.length !== rows.length) throw new Error('Pengaturan belum tersimpan seluruhnya.');
    notifyMutation();
    return settings;
  },
  async getHero(): Promise<HeroSection> { return getDocument('hero'); },
  async updateHero(value: HeroSection): Promise<HeroSection> { return saveDocument('hero', value); },
  async getFitur(): Promise<FiturItem[]> { return getDocument('fitur'); },
  async saveFiturList(value: FiturItem[]) { return saveDocument('fitur', value); },
  async getLangkah(): Promise<LangkahPenggunaan[]> { return getDocument('langkah'); },
  async saveLangkahList(value: LangkahPenggunaan[]) { return saveDocument('langkah', value); },
  async getFaq(): Promise<FAQItem[]> { return getDocument('faq'); },
  async saveFaqList(value: FAQItem[]) { return saveDocument('faq', value); },
  async getTestimoni(): Promise<TestimoniItem[]> { return getDocument('testimoni'); },
  async saveTestimoniList(value: TestimoniItem[]) { return saveDocument('testimoni', value); },
  async getPengumuman(): Promise<PengumumanItem[]> { return getDocument('pengumuman'); },
  async savePengumumanList(value: PengumumanItem[]) { return saveDocument('pengumuman', value); },
  async getMenu(): Promise<MenuNavigasi[]> { return getDocument('menu'); },
  async saveMenuList(value: MenuNavigasi[]) { return saveDocument('menu', value); },
};
