import { Role, UserProfile, MahasiswaPKL, AuditLog } from '../types';
import rawMahasiswaData from '../../data/mahasiswa_pkl.json';

export const SUPER_ADMIN_PROFILE: UserProfile = {
  id: 'founder-1',
  nama: 'Bpk. H. Rekso (Founder & CEO)',
  email: 'founder@seveninc.co.id',
  jabatan: 'Pemilik Perusahaan (Kuasa Penuh)',
  role: 'super_admin',
  kuasa_penuh: true,
  avatar_url: '',
  created_at: '2023-01-01T00:00:00Z',
};

export const HRD_ADMIN_PROFILE: UserProfile = {
  id: 'hrd-1',
  nama: 'Siti Rahma, S.Psi. (HRD Officer)',
  email: 'hrd@seveninc.co.id',
  jabatan: 'HRD Pengelola Dashboard Operasional',
  role: 'admin',
  kuasa_penuh: false,
  avatar_url: '',
  created_at: '2023-06-01T00:00:00Z',
};

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

export const authService = {
  getSuperAdminProfile(): UserProfile {
    return SUPER_ADMIN_PROFILE;
  },

  getHRDProfile(): UserProfile {
    return HRD_ADMIN_PROFILE;
  },

  getCurrentUser(): UserProfile {
    return getStored<UserProfile>('current_user', HRD_ADMIN_PROFILE);
  },

  setCurrentUser(user: UserProfile): void {
    setStored('current_user', user);
  },

  async signIn(usernameOrEmail: string, _password?: string, requestedRole?: Role): Promise<UserProfile> {
    const clean = usernameOrEmail.toLowerCase().trim();

    // 1. Super Admin (Founder)
    if (
      requestedRole === 'super_admin' ||
      clean === 'founder' ||
      clean === 'owner' ||
      clean === 'superadmin' ||
      clean.includes('founder')
    ) {
      this.setCurrentUser(SUPER_ADMIN_PROFILE);
      this.recordAuditLog(
        SUPER_ADMIN_PROFILE.nama,
        'super_admin',
        'Login Sistem',
        'Super Admin (Founder & Pemilik) masuk ke panel monitoring eksekutif.'
      );
      return SUPER_ADMIN_PROFILE;
    }

    // 2. Mahasiswa PKL
    if (
      requestedRole === 'mahasiswa' ||
      clean.includes('@') ||
      clean.startsWith('2024') ||
      clean === 'mahasiswa' ||
      clean.includes('andi') ||
      clean.includes('rina') ||
      clean.includes('siti') ||
      clean.includes('budi') ||
      clean.includes('dika')
    ) {
      const allMhs = await this.getMahasiswaPKLList();
      const matched =
        allMhs.find(
          (m) =>
            m.email.toLowerCase() === clean ||
            m.nim === clean ||
            m.nama.toLowerCase().includes(clean)
        ) || allMhs[0];

      const mhsProfile: UserProfile = {
        id: matched.id,
        nama: matched.nama,
        email: matched.email,
        jabatan: `Peserta Magang (${matched.bagian}) - PT Seven Inc.`,
        role: 'mahasiswa',
        nim: matched.nim,
        bagian: matched.bagian,
        institusi: matched.institusi,
        periode: matched.periode,
        kuasa_penuh: false,
        created_at: new Date().toISOString(),
      };

      this.setCurrentUser(mhsProfile);
      this.recordAuditLog(
        matched.nama,
        'mahasiswa',
        'Login Mahasiswa',
        `Mahasiswa PKL (${matched.email}) masuk ke portal nilai dan peringkat pribadi.`
      );
      return mhsProfile;
    }

    // 3. Default to Admin (HRD)
    this.setCurrentUser(HRD_ADMIN_PROFILE);
    this.recordAuditLog(
      HRD_ADMIN_PROFILE.nama,
      'admin',
      'Login Sistem',
      'Admin HRD masuk ke dashboard operasional PKL PT Seven Inc.'
    );
    return HRD_ADMIN_PROFILE;
  },

  signOut(): void {
    localStorage.removeItem('spk_current_user');
  },

  // DATA MAHASISWA PKL
  async getMahasiswaPKLList(): Promise<MahasiswaPKL[]> {
    return getStored<MahasiswaPKL[]>('mahasiswa_pkl_data', rawMahasiswaData as MahasiswaPKL[]);
  },

  async saveMahasiswaPKL(data: MahasiswaPKL): Promise<MahasiswaPKL> {
    const current = await this.getMahasiswaPKLList();
    const idx = current.findIndex(
      (m) => m.id === data.id || m.email === data.email || (data.nim && m.nim === data.nim)
    );

    let updated: MahasiswaPKL[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...data };
    } else {
      updated = [
        ...current,
        {
          ...data,
          id: data.id || `mhs-${Date.now()}`,
        },
      ];
    }

    setStored('mahasiswa_pkl_data', updated);
    this.recordAuditLog(
      this.getCurrentUser().nama,
      this.getCurrentUser().role,
      'Simpan Mahasiswa PKL',
      `Menyimpan data mahasiswa ${data.nama} (Email: ${data.email}).`
    );
    return data;
  },

  async deleteMahasiswaPKL(id: string): Promise<boolean> {
    const current = await this.getMahasiswaPKLList();
    const target = current.find((m) => m.id === id);
    const updated = current.filter((m) => m.id !== id);
    setStored('mahasiswa_pkl_data', updated);
    if (target) {
      this.recordAuditLog(
        this.getCurrentUser().nama,
        this.getCurrentUser().role,
        'Hapus Mahasiswa PKL',
        `Menghapus data mahasiswa ${target.nama} (Email: ${target.email}).`
      );
    }
    return true;
  },

  async resetMahasiswaPKLList(): Promise<MahasiswaPKL[]> {
    localStorage.removeItem('spk_mahasiswa_pkl_data');
    const defaults = rawMahasiswaData as MahasiswaPKL[];
    setStored('mahasiswa_pkl_data', defaults);
    this.recordAuditLog(
      this.getCurrentUser().nama,
      this.getCurrentUser().role,
      'Reset Data Penilaian SMART',
      'Mengembalikan seluruh data nilai mahasiswa PKL ke 5 data alternatif benchmark awal.'
    );
    return defaults;
  },

  // AUDIT LOGS FOR FOUNDER MONITORING
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>('audit_logs', [
      {
        id: 'log-1',
        aktor: 'Siti Rahma, S.Psi. (HRD)',
        role: 'admin',
        aksi: 'Input Penilaian Mahasiswa',
        rincian: 'Memperbarui skor kedisiplinan dan kehadiran untuk 5 mahasiswa Periode 1 - 2025.',
        waktu: '2025-01-15 14:30 WIB',
      },
      {
        id: 'log-2',
        aktor: 'Bpk. H. Rekso (Founder)',
        role: 'super_admin',
        aksi: 'Pengesahan Peringkat SMART',
        rincian: 'Mengesahkan penetapan Peringkat 1 untuk Andi Pratama dengan skor 0.9200.',
        waktu: '2025-01-16 09:15 WIB',
      },
      {
        id: 'log-3',
        aktor: 'Siti Rahma, S.Psi. (HRD)',
        role: 'admin',
        aksi: 'Ekspor Data Mahasiswa',
        rincian: 'Mengunduh rekapitulasi data mahasiswa PKL dalam format CSV dan JSON.',
        waktu: '2025-01-17 11:20 WIB',
      },
    ]);
  },

  recordAuditLog(aktor: string, role: Role, aksi: string, rincian: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      aktor,
      role,
      aksi,
      rincian,
      waktu: new Date().toLocaleString('id-ID'),
    };
    setStored('audit_logs', [newLog, ...logs].slice(0, 50));
  },
};
