import {
  Alternatif,
  HasilDetail,
  HasilPerhitungan,
  Kriteria,
  NilaiAlternatif,
  PeriodePKL,
  SkalaNilai,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  INITIAL_ALTERNATIF,
  INITIAL_KRITERIA,
  INITIAL_NILAI,
  INITIAL_PERIODE,
  INITIAL_SKALA,
} from './initialData';

// Local storage helpers
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

export const spkService = {
  // KRITERIA
  async getKriteria(): Promise<Kriteria[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('kriteria').select('*').order('urutan', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('kriteria', INITIAL_KRITERIA);
  },

  async saveKriteria(kriteria: Kriteria): Promise<Kriteria> {
    const current = await this.getKriteria();
    let updated: Kriteria[];
    const idx = current.findIndex((k) => k.id === kriteria.id);
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = kriteria;
    } else {
      updated = [...current, { ...kriteria, id: kriteria.id || `k-${Date.now()}` }];
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('kriteria').upsert(kriteria);
    }
    setStored('kriteria', updated);
    return kriteria;
  },

  async deleteKriteria(id: string): Promise<boolean> {
    const current = await this.getKriteria();
    const updated = current.filter((k) => k.id !== id);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('kriteria').delete().eq('id', id);
    }
    setStored('kriteria', updated);
    return true;
  },

  // ALTERNATIF (Tempat PKL)
  async getAlternatif(): Promise<Alternatif[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('alternatif').select('*').order('kode', { ascending: true });
      if (!error && data) return data;
    }
    return getStored('alternatif', INITIAL_ALTERNATIF);
  },

  async saveAlternatif(alternatif: Alternatif): Promise<Alternatif> {
    const current = await this.getAlternatif();
    let updated: Alternatif[];
    const idx = current.findIndex((a) => a.id === alternatif.id);
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = alternatif;
    } else {
      const newAlt = {
        ...alternatif,
        id: alternatif.id || `alt-${Date.now()}`,
        kode: alternatif.kode || `A${current.length + 1}`,
      };
      updated = [...current, newAlt];
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('alternatif').upsert(alternatif);
    }
    setStored('alternatif', updated);
    return alternatif;
  },

  async deleteAlternatif(id: string): Promise<boolean> {
    const current = await this.getAlternatif();
    const updated = current.filter((a) => a.id !== id);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('alternatif').delete().eq('id', id);
    }
    setStored('alternatif', updated);
    return true;
  },

  // SKALA NILAI
  async getSkalaNilai(): Promise<SkalaNilai[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('skala_nilai').select('*').order('nilai', { ascending: false });
      if (!error && data) return data;
    }
    return getStored('skala', INITIAL_SKALA);
  },

  // NILAI ALTERNATIF (Matriks)
  async getNilaiMatrix(): Promise<NilaiAlternatif[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('nilai_alternatif').select('*');
      if (!error && data) return data;
    }
    return getStored('nilai_alternatif', INITIAL_NILAI);
  },

  async updateNilaiCell(alternatifId: string, kriteriaId: string, nilai: number): Promise<void> {
    const current = await this.getNilaiMatrix();
    const idx = current.findIndex(
      (n) => n.alternatif_id === alternatifId && n.kriteria_id === kriteriaId
    );

    let updated: NilaiAlternatif[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], nilai };
    } else {
      updated = [...current, { alternatif_id: alternatifId, kriteria_id: kriteriaId, nilai }];
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('nilai_alternatif').upsert({
        alternatif_id: alternatifId,
        kriteria_id: kriteriaId,
        nilai,
      });
    }
    setStored('nilai_alternatif', updated);
  },

  // PERIODE PKL
  async getPeriode(): Promise<PeriodePKL[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('periode_pkl').select('*').order('tanggal_mulai', { ascending: false });
      if (!error && data) return data;
    }
    return getStored('periode', INITIAL_PERIODE);
  },

  async savePeriode(periode: PeriodePKL): Promise<PeriodePKL> {
    const current = await this.getPeriode();
    let updated: PeriodePKL[];
    const idx = current.findIndex((p) => p.id === periode.id);
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = periode;
    } else {
      updated = [...current, { ...periode, id: periode.id || `per-${Date.now()}` }];
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.from('periode_pkl').upsert(periode);
    }
    setStored('periode', updated);
    return periode;
  },

  // HASIL PERHITUNGAN
  async simpanHasil({
    userId,
    bobotSnapshot,
    ranking,
    catatan,
  }: {
    userId: string;
    bobotSnapshot: Record<string, number>;
    ranking: HasilDetail[];
    catatan?: string;
  }): Promise<HasilPerhitungan> {
    const hasilId = `hasil-${Date.now()}`;
    const newRecord: HasilPerhitungan = {
      id: hasilId,
      user_id: userId,
      created_at: new Date().toISOString(),
      bobot_snapshot: bobotSnapshot,
      catatan: catatan || 'Perhitungan kustomisasi mandiri oleh mahasiswa.',
      ranking,
    };

    const currentRiwayat = getStored<HasilPerhitungan[]>('riwayat_hasil', []);
    setStored('riwayat_hasil', [newRecord, ...currentRiwayat]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: headerData } = await supabase
          .from('hasil_perhitungan')
          .insert({
            user_id: userId,
            bobot_snapshot: bobotSnapshot,
            catatan,
          })
          .select()
          .single();

        if (headerData) {
          const detailRows = ranking.map((r) => ({
            hasil_id: headerData.id,
            alternatif_id: r.alternatif_id,
            skor_akhir: r.skor_akhir,
            peringkat: r.peringkat,
            utilitas: r.utilitas,
            kategori: r.kategori,
          }));
          await supabase.from('hasil_detail').insert(detailRows);
        }
      } catch (err) {
        console.warn('Supabase insert warning:', err);
      }
    }

    return newRecord;
  },

  async getRiwayatHasil(userId: string): Promise<HasilPerhitungan[]> {
    const all = getStored<HasilPerhitungan[]>('riwayat_hasil', []);
    return all.filter((h) => h.user_id === userId);
  },

  async getSemuaHasil(): Promise<HasilPerhitungan[]> {
    return getStored<HasilPerhitungan[]>('riwayat_hasil', []);
  },
};
