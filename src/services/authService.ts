import { mahasiswaService } from './mahasiswaService';
import { spkService } from './spkService';
import { jalankanSMARTMahasiswa } from '../utils/smart';
import { Role, UserProfile, MahasiswaPKL, AuditLog } from '../types';
import { database, checkError, readRows } from '../lib/database';
import { notifyMutation } from '../lib/mutationFeedback';

export const GUEST_PROFILE: UserProfile = {
  id: 'guest', nama: 'Tamu', email: '', jabatan: 'Pengunjung', role: 'mahasiswa',
};
let currentUser: UserProfile = GUEST_PROFILE;

export const authService = {
  getCurrentUser(): UserProfile { return currentUser; },

  async loadCurrentUser(): Promise<UserProfile> {
    const client = database();
    const { data: { session } } = await client.auth.getSession();
    if (!session) return (currentUser = GUEST_PROFILE);
    const { data: { user }, error: authError } = await client.auth.getUser();
    checkError(authError);
    if (!user) return (currentUser = GUEST_PROFILE);
    const { data, error } = await client.from('app_profiles').select('*').eq('id', user.id).single();
    checkError(error);
    if (!data) throw new Error('Profil akun belum tersedia di Supabase. Hubungi pengelola.');
    return (currentUser = data);
  },

  async signIn(email: string, password = '', _requestedRole?: Role): Promise<UserProfile> {
    const loginEmail = email.trim().toLowerCase() === 'founder' ? 'founder@seveninc.co.id' : email.trim();
    const { error } = await database().auth.signInWithPassword({ email: loginEmail, password });
    checkError(error);
    const profile = await this.loadCurrentUser();
    return profile;
  },

  async signOut(): Promise<void> {
    const { error } = await database().auth.signOut();
    checkError(error);
    currentUser = GUEST_PROFILE;
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await database().from('app_profiles').update({
      nama: profile.nama, no_hp: profile.no_hp, avatar_url: profile.avatar_url,
      nim: profile.nim, prodi: profile.prodi, angkatan: profile.angkatan,
    }).eq('id', currentUser.id).select().single();
    checkError(error);
    if (!data) throw new Error('Profil belum tersimpan.');
    notifyMutation('Profil berhasil diperbarui di Supabase.');
    return (currentUser = data);
  },

  async listUsers(): Promise<UserProfile[]> { return readRows('app_profiles', 'nama'); },

  // DATA MAHASISWA PKL
  async getMahasiswaPKLList(): Promise<MahasiswaPKL[]> {
    const [students, criteria] = await Promise.all([mahasiswaService.list(), spkService.getKriteria()]);
    const calculated = jalankanSMARTMahasiswa({ mahasiswaList: students, kriteriaList: criteria });
    const results = new Map(calculated.ranking.map((item) => [item.id, item]));
    return students.map((student) => {
      const result = results.get(student.id)!;
      return { ...student, utility: result.utilitas, skor_akhir_smart: result.skor_akhir,
        nilai_skala_100: result.nilai_skala_100, peringkat: result.peringkat,
        keterangan_nilai: result.keterangan };
    });
  },

  async saveMahasiswaPKL(data: MahasiswaPKL): Promise<MahasiswaPKL> {
    const [saved] = await mahasiswaService.saveMany([data]);
    return saved;
  },

  async importMahasiswaPKL(data: MahasiswaPKL[], replace = false): Promise<MahasiswaPKL[]> {
    return mahasiswaService.saveMany(data, replace);
  },

  async migrateLocalMahasiswa(): Promise<number> {
    let local: MahasiswaPKL[];
    try { local = JSON.parse(localStorage.getItem('spk_mahasiswa_pkl_data') ?? '[]'); }
    catch { throw new Error('Cadangan data browser tidak dapat dibaca.'); }
    if (!Array.isArray(local) || !local.length) throw new Error('Tidak ada data mahasiswa lama di browser ini.');
    await mahasiswaService.saveMany(local);
    return local.length;
  },

  async deleteMahasiswaPKL(id: string): Promise<boolean> {
    await mahasiswaService.remove(id);
    return true;
  },

  async resetMahasiswaPKLList(): Promise<MahasiswaPKL[]> {
    const current = await mahasiswaService.list();
    return mahasiswaService.saveMany(current.map(row => ({...row,rekap_bulanan:null,nilai_kriteria:{},utility:{},skor_akhir_smart:0,nilai_skala_100:0,peringkat:0}))); 
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await database().from('audit_logs').select('*').order('visible_since', { ascending: false }).order('waktu', { ascending: false }).order('id', { ascending: false }).limit(20);
    checkError(error); return data ?? [];
  },

  async recordAuditLog(_aktor: string, _role: Role, aksi: string, rincian: string): Promise<void> {
    const { error } = await database().rpc('record_app_audit', { p_aksi: aksi, p_rincian: rincian });
    checkError(error);
  },

  async certifyRanking(periode: string): Promise<void> {
    const { error } = await database().rpc('certify_smart_ranking', { p_periode: periode });
    checkError(error);
    notifyMutation('Peringkat berhasil disahkan.');
  },
};
