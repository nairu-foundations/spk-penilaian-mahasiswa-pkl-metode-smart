import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const storageService = {
  async uploadGambar(bucket: 'konten' | 'alternatif', file: File): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    }

    // Local / fallback simulation: convert to DataURL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      reader.readAsDataURL(file);
    });
  },

  getPublicUrl(bucket: string, path: string): string {
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return path;
  },

  async hapusGambar(bucket: string, path: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return !error;
    }
    return true;
  },
};
