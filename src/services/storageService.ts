import { database, checkError } from '../lib/database';
export const storageService = {
  async uploadGambar(bucket: 'konten' | 'alternatif', file: File): Promise<string> {
    const filePath = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await database().storage.from(bucket).upload(filePath, file);
    checkError(error);
    return database().storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  },
  getPublicUrl(bucket: string, path: string): string { return database().storage.from(bucket).getPublicUrl(path).data.publicUrl; },
  async hapusGambar(bucket: string, path: string): Promise<boolean> {
    const { error } = await database().storage.from(bucket).remove([path]); checkError(error); return true;
  },
};
