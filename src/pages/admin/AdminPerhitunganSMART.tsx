import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Play,
  RotateCcw,
  Target,
  Calculator,
  Award,
  Layers,
  ArrowRight,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Check,
  Save,
  UserPlus,
  Info,
  FileSpreadsheet,
  UploadCloud,
  FileDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '../../hooks/useData';
import { authService } from '../../services/authService';
import { spkService } from '../../services/spkService';
import { jalankanSMARTMahasiswa, SMARTMahasiswaResult } from '../../utils/smart';
import { Skeleton } from '../../components/common/Skeleton';
import { MahasiswaPKL } from '../../types';
import {
  unduhTemplateExcelSMART,
  bacaFileExcelMahasiswa,
  eksporHasilSMARTKeExcel,
} from '../../utils/excelHelper';

export const AdminPerhitunganSMART: React.FC = () => {
  const { error: mahasiswaError,
    data: mahasiswaList,
    loading: loadingMhs,
    refetch: refetchMhs,
  } = useQuery(() => authService.getMahasiswaPKLList());
  const { error: kriteriaError, data: kriteriaList, loading: loadingKrit } = useQuery(() => spkService.getKriteria());

  const [activeStep, setActiveStep] = useState<number>(4);
  const [calculationResult, setCalculationResult] = useState<SMARTMahasiswaResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  // Modal & Input state for inserting data into SMART calculation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstitusi, setFormInstitusi] = useState('PT Seven Inc.');
  const [formBagian, setFormBagian] = useState('IT / Software Engineering');
  const [formC1, setFormC1] = useState<number>(90);
  const [formC2, setFormC2] = useState<number>(90);
  const [formC3, setFormC3] = useState<number>(85);

  // Inline editing state in Step 2 Matrix
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [matrixDraft, setMatrixDraft] = useState<Record<string, { C1: number; C2: number; C3: number }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automated Excel Import State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelParsedData, setExcelParsedData] = useState<MahasiswaPKL[] | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  // Handle Excel File Selection
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingExcel(true);
    try {
      const parsed = await bacaFileExcelMahasiswa(file);
      setExcelFile(file);
      setExcelParsedData(parsed);
      setIsExcelModalOpen(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membaca berkas Excel.');
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  // Execute Automated SMART Calculation from Imported Excel Data
  const handleExecuteExcelSMART = async () => {
    if (!excelParsedData || excelParsedData.length === 0) return;
    setIsImportingExcel(true);
    try {
      await authService.importMahasiswaPKL(excelParsedData, replaceMode);

      // 3. Refetch student list
      await refetchMhs();

      // 4. Calculate SMART automatically
      const freshList = await authService.getMahasiswaPKLList();
      if (kriteriaList) {
        const res = jalankanSMARTMahasiswa({
          mahasiswaList: freshList,
          kriteriaList,
        });
        setCalculationResult(res);
      }

      // 5. Jump to Step 4 (Rankings & Results)
      setActiveStep(4);
      setIsExcelModalOpen(false);
      setNotification({
        type: 'success',
        message: `Berhasil mengimpor ${excelParsedData.length} data mahasiswa dari "${excelFile?.name || 'file Excel'}". Seluruh matriks & perangkingan SMART otomatis terupdate!`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses otomasi perhitungan SMART dari file Excel.');
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleExportFullExcel = () => {
    if (!calculationResult || calculationResult.ranking.length === 0) {
      alert('Belum ada data perhitungan SMART untuk diekspor.');
      return;
    }
    eksporHasilSMARTKeExcel(calculationResult.ranking, 'Periode 1 - 2025');
  };

  const isLoading = loadingMhs || loadingKrit;

  // Auto calculate when data arrives or updates
  useEffect(() => {
    if (mahasiswaList && kriteriaList) {
      try {
        const res = jalankanSMARTMahasiswa({
          mahasiswaList,
          kriteriaList,
        });
        setCalculationResult(res);

        // Pre-fill matrix draft
        const draft: Record<string, { C1: number; C2: number; C3: number }> = {};
        res.matriksKeputusan.forEach((item) => {
          draft[item.id] = {
            C1: item.nilai_mentah.C1 ?? 80,
            C2: item.nilai_mentah.C2 ?? 80,
            C3: item.nilai_mentah.C3 ?? 80,
          };
        });
        if (!isInlineEdit) setMatrixDraft(draft);
      } catch (err) {
        console.warn('Auto calculation warning:', err);
      }
    }
  }, [mahasiswaList, kriteriaList]);

  const handleRunCalculation = () => {
    if (!mahasiswaList || !kriteriaList) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const res = jalankanSMARTMahasiswa({
          mahasiswaList,
          kriteriaList,
        });
        setCalculationResult(res);
        setActiveStep(4);
        setJustCalculated(true);
        setTimeout(() => setJustCalculated(false), 2500);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Gagal memproses perhitungan SMART.');
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  // Open modal to add new student
  const handleOpenAddModal = () => {
    setEditingStudentId(null);
    const nextNum = (mahasiswaList?.length || 5) + 1;
    setFormNama('');
    setFormEmail(`mahasiswa${nextNum}@mail.ac.id`);
    setFormInstitusi('Universitas Gadjah Mada');
    setFormBagian('IT / Software Engineering');
    setFormC1(90);
    setFormC2(85);
    setFormC3(88);
    setIsModalOpen(true);
  };

  // Open modal to edit existing student
  const handleOpenEditModal = (mhsId: string) => {
    const student = mahasiswaList?.find((m) => m.id === mhsId);
    if (!student) return;

    setEditingStudentId(student.id);
    setFormNama(student.nama);
    setFormEmail(student.email || `${student.nim}@mail.ac.id`);
    setFormInstitusi(student.institusi || 'PT Seven Inc.');
    setFormBagian(student.bagian || 'IT / Software Engineering');

    // Retrieve C1, C2, C3 scores
    const calcItem = calculationResult?.matriksKeputusan.find((m) => m.id === student.id);
    setFormC1(calcItem?.nilai_mentah.C1 ?? student.nilai_kriteria?.C1 ?? 85);
    setFormC2(calcItem?.nilai_mentah.C2 ?? student.nilai_kriteria?.C2 ?? 85);
    setFormC3(calcItem?.nilai_mentah.C3 ?? student.nilai_kriteria?.C3 ?? 85);
    setIsModalOpen(true);
  };

  // Submit Modal: Insert / Update Student and run SMART
  const handleSaveStudentModal = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!formNama.trim() || !formEmail.trim()) {
        alert('Mohon isi nama lengkap dan email mahasiswa.');
        return;
      }

      const c1 = Math.max(0, Math.min(100, Number(formC1) || 0));
      const c2 = Math.max(0, Math.min(100, Number(formC2) || 0));
      const c3 = Math.max(0, Math.min(100, Number(formC3) || 0));

      let targetStudent: MahasiswaPKL;
      if (editingStudentId) {
        const existing = mahasiswaList?.find((m) => m.id === editingStudentId);
        targetStudent = {
          ...existing!,
          nama: formNama.trim(),
          email: formEmail.trim(),
          institusi: formInstitusi.trim(),
          bagian: formBagian.trim(),
          nilai_kriteria: {
            C1: c1,
            C2: c2,
            C3: c3,
          },
        };
      } else {
        const codeIndex = (mahasiswaList?.length || 5) + 1;
        targetStudent = {
          id: `mhs-${Date.now()}`,
          nama: formNama.trim(),
          email: formEmail.trim(),
          nim: `2024100${codeIndex}`,
          institusi: formInstitusi.trim(),
          bagian: formBagian.trim(),
          periode: 'Periode 1 - 2025',
          kode_alternatif: `A${codeIndex}`,
          status: 'Aktif',
          tanggal_mulai: '2025-01-01',
          tanggal_selesai: '2025-06-30',
          no_hp: '081234567890',
          nilai_kriteria: {
            C1: c1,
            C2: c2,
            C3: c3,
          },
        };
      }

      await authService.saveMahasiswaPKL(targetStudent);
      await refetchMhs();
      setIsModalOpen(false);

      setNotification({
        type: 'success',
        message: `Data mahasiswa ${targetStudent.nama} berhasil dimasukkan ke dalam perhitungan SMART!`,
      });
      setTimeout(() => setNotification(null), 4000);
      setActiveStep(4); // Switch to Results tab to see new rank
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Delete student from SMART calculation
  const handleDeleteStudent = async (id: string, nama: string) => {
    try {
      if (confirm(`Apakah Anda yakin ingin menghapus mahasiswa ${nama} dari daftar perhitungan SMART?`)) {
        await authService.deleteMahasiswaPKL(id);
        await refetchMhs();
        setNotification({
          type: 'success',
          message: `Mahasiswa ${nama} telah dihapus dari perhitungan SMART.`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Reset to default 5 benchmark students
  const handleResetDefaults = async () => {
    try {
      if (confirm('Kosongkan seluruh nilai penilaian? Identitas mahasiswa tetap dipertahankan.')) {
        await authService.resetMahasiswaPKLList();
        await refetchMhs();
        setNotification({
          type: 'success',
          message: 'Nilai penilaian telah dikosongkan di database.',
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Save changes from Step 2 inline matrix inputs
  const handleSaveInlineMatrix = async () => {
    try {
      if (!mahasiswaList) return;

      const updates = mahasiswaList.filter((mhs) => matrixDraft[mhs.id]).map((mhs) => {
        const draft = matrixDraft[mhs.id];
        return { ...mhs, nilai_kriteria: {
          C1: Math.max(0, Math.min(100, draft.C1)),
          C2: Math.max(0, Math.min(100, draft.C2)),
          C3: Math.max(0, Math.min(100, draft.C3)),
        } };
      });
      await authService.importMahasiswaPKL(updates);

      await refetchMhs();
      setIsInlineEdit(false);
      setNotification({
        type: 'success',
        message: 'Perubahan matriks keputusan berhasil disimpan dan perhitungan SMART telah diperbarui!',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan perubahan ke Supabase.');
    }
  };

  // Real-time calculation preview inside modal
  const modalSimulation = useMemo(() => {
    const c1 = Number(formC1) || 0;
    const c2 = Number(formC2) || 0;
    const c3 = Number(formC3) || 0;

    // Utility 0-100 scale: u = x / 100
    const u1 = c1 / 100;
    const u2 = c2 / 100;
    const u3 = c3 / 100;

    // Weights: w1=0.30, w2=0.20, w3=0.50
    const vi = 0.3 * u1 + 0.2 * u2 + 0.5 * u3;
    const skala100 = vi * 100;

    let keterangan = 'Kurang';
    if (skala100 >= 85) keterangan = 'Sangat Baik';
    else if (skala100 >= 75) keterangan = 'Baik';
    else if (skala100 >= 60) keterangan = 'Cukup';

    return { u1, u2, u3, vi, skala100, keterangan };
  }, [formC1, formC2, formC3]);

  const activeKriteria = (kriteriaList || [])
    .filter((k) => k.aktif)
    .sort((a, b) => a.urutan - b.urutan);

  return (
    <div className="space-y-6">
      {(mahasiswaError || kriteriaError) && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">{mahasiswaError || kriteriaError}</div>}
      {/* Header with Prominent Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Perhitungan SMART
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard &gt; Perhitungan SMART Penilaian Mahasiswa PKL PT Seven Inc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            title="Kosongkan nilai penilaian"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Nilai</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Masukkan Data ke Perhitungan SMART</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EXCEL SMART AUTOMATION CARD */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-blue-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Otomatisasi Input File Excel &amp; Perhitungan SMART
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-Update Realtime
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                Input Data Mahasiswa dari Berkas Excel (.xlsx / .xls / .csv)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Unggah file spreadsheet mahasiswa yang telah tersusun sesuai kolom format (Nama, Email, dan 3 Kriteria Benefit: Kehadiran C1, Ketepatan Waktu C2, Penyelesaian Tugas C3). Saat perhitungan SMART dijalankan, seluruh matriks dan peringkat otomatis terupdate.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-start md:justify-end">
            <button
              onClick={unduhTemplateExcelSMART}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
              title="Unduh Format Template Excel Resmi (.xlsx)"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Unduh Format Excel</span>
            </button>

            <label
              htmlFor="excel-auto-input"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isParsingExcel ? 'Membaca Excel...' : 'Upload File Excel Mahasiswa'}</span>
              <input
                id="excel-auto-input"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileSelect}
                className="hidden"
                disabled={isParsingExcel || isImportingExcel}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Steps, Formula & Weight Information */}
        <div className="lg:col-span-4 space-y-4">
          {/* Langkah Perhitungan SMART Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Langkah Perhitungan SMART
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                {mahasiswaList?.length || 5} Alternatif
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1: Normalisasi Bobot */}
              <div
                onClick={() => setActiveStep(1)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeStep === 1
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Normalisasi Bobot (w_j)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      b_j / sum(b_k) -&gt; 0.30, 0.20, 0.50
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              {/* Step 2: Matriks Keputusan */}
              <div
                onClick={() => setActiveStep(2)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeStep === 2
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Matriks Keputusan (X)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Input nilai kinerja mentah skala 0-100
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              {/* Step 3: Nilai Utilitas */}
              <div
                onClick={() => setActiveStep(3)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeStep === 3
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Normalisasi Nilai Utilitas (u_ij)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      u_j(a_i) = x_ij / 100
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              {/* Step 4: Nilai Akhir & Ranking */}
              <div
                onClick={() => setActiveStep(4)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeStep === 4
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Nilai Akhir &amp; Peringkat Juara
                    </span>
                    <span className="text-[10px] text-slate-400">
                      V(a_i) = sum(w_j * u_ij)
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            </div>

            <button
              onClick={handleRunCalculation}
              disabled={isProcessing}
              className={`mt-5 w-full py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                justCalculated
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" /> Memproses Perhitungan...
                </>
              ) : justCalculated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Perhitungan Selesai!
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Proses Perhitungan
                </>
              )}
            </button>
          </div>

          {/* Informasi Bobot Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Informasi Perhitungan Bobot (wj)
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-100 dark:border-slate-800">
                <span className="block font-bold text-blue-600">C1: 0.30</span>
                <span className="text-[10px] text-slate-500">Kehadiran (30%)</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-100 dark:border-slate-800">
                <span className="block font-bold text-blue-600">C2: 0.20</span>
                <span className="text-[10px] text-slate-500">Ketepatan (20%)</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-100 dark:border-slate-800">
                <span className="block font-bold text-blue-600">C3: 0.50</span>
                <span className="text-[10px] text-slate-500">Tugas (50%)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2 font-medium">
              Total Bobot = 1.00 (100% Ternormalisasi Benefit)
            </p>
          </div>

          {/* Rumus SMART Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Rumus Perhitungan Metode SMART</span>
            </div>

            <div className="p-3 bg-slate-950 text-white rounded-lg font-mono text-xs shadow-inner space-y-2">
              <div>
                <p className="text-amber-400 font-bold text-[11px]">1. Normalisasi Bobot Kriteria:</p>
                <p className="text-slate-300">w_j = b_j / &Sigma; b_k</p>
              </div>
              <div>
                <p className="text-sky-400 font-bold text-[11px]">2. Nilai Utilitas Benefit:</p>
                <p className="text-slate-300">u_j(a_i) = (x_ij - L_j) / (H_j - L_j)</p>
                <p className="text-slate-400 text-[10px]">Untuk skala 0-100: u_ij = x_ij / 100</p>
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-[11px]">3. Nilai Akhir Alternatif (Vi):</p>
                <p className="text-slate-300">V(a_i) = &Sigma; [w_j &times; u_j(a_i)]</p>
                <p className="text-slate-400 text-[10px]">V = (0.30&times;u1) + (0.20&times;u2) + (0.50&times;u3)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step Tables with Interactive Inputs & Editing */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Table Header Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeStep === 1 && 'Tahap 1: Normalisasi Bobot Kriteria (wj)'}
                  {activeStep === 2 && 'Tahap 2: Matriks Keputusan (X) Nilai Kinerja Mahasiswa'}
                  {activeStep === 3 && 'Tahap 3: Matriks Normalisasi Nilai Utilitas (u_ij)'}
                  {activeStep === 4 && 'Tahap 4: Hasil Nilai Akhir SMART & Perangkingan Rekomendasi'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeStep === 1 && 'Perhitungan rasio bobot setiap kriteria terhadap total bobot (100%)'}
                  {activeStep === 2 && 'Data mentah penilaian kedisiplinan dan kinerja PKL (skala 0 - 100). Anda dapat mengedit nilai atau menambah mahasiswa.'}
                  {activeStep === 3 && 'Konversi nilai mentah menjadi utilitas skala 0 – 1 (u_ij = x_ij / 100)'}
                  {activeStep === 4 && 'Hasil perkalian bobot w_j dengan utilitas u_ij beserta urutan peringkat juara'}
                </p>
              </div>

              {/* Action buttons depending on active step */}
              <div className="flex items-center gap-2 shrink-0">
                {activeStep === 2 ? (
                  <>
                    <button
                      onClick={() => setIsInlineEdit(!isInlineEdit)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                        isInlineEdit
                          ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isInlineEdit ? 'Batal Edit' : 'Edit Nilai C1/C2/C3'}</span>
                    </button>
                    <button
                      onClick={handleOpenAddModal}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportFullExcel}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Ekspor Hasil SMART ke File Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={handleOpenAddModal}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 flex items-center gap-1.5 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Masukkan Alternatif</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !calculationResult ? (
              <div className="p-12 text-center text-slate-500">
                <p>Klik tombol &quot;Proses Perhitungan&quot; untuk menampilkan matriks SMART.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* STEP 1 TABLE: Bobot Kriteria */}
                {activeStep === 1 && (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 w-12 text-center">Kode</th>
                        <th className="py-3 px-4">Nama Kriteria Penilaian</th>
                        <th className="py-3 px-4 text-center">Jenis</th>
                        <th className="py-3 px-4 text-center">Bobot Awal (b_j)</th>
                        <th className="py-3 px-4 text-center">Rumus Normalisasi</th>
                        <th className="py-3 px-4 text-center font-bold text-blue-600">
                          Bobot Normal (w_j)
                        </th>
                        <th className="py-3 px-4 text-center">Persentase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {activeKriteria.map((k) => {
                        const w = calculationResult.bobotNormal[k.kode] ?? k.bobot_awal / 100;
                        return (
                          <tr key={k.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600">
                              {k.kode}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {k.nama}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                {k.tipe}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono tabular-nums">
                              {k.bobot_awal}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                              {k.bobot_awal} / 100
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                              {w.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {(w * 100).toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-xs border-t border-slate-200 dark:border-slate-800">
                        <td colSpan={3} className="py-3 px-4 text-right">
                          Total
                        </td>
                        <td className="py-3 px-4 text-center font-mono">100</td>
                        <td className="py-3 px-4 text-center text-slate-400">&Sigma; b_k = 100</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-600 text-sm">
                          1.0000
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-600">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* STEP 2 TABLE: Matriks Keputusan Mentah (X) with Inline Editing & Delete */}
                {activeStep === 2 && (
                  <div>
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <th className="py-3 px-4 w-12 text-center">Kode</th>
                          <th className="py-3 px-4 min-w-[180px]">Nama Mahasiswa PKL</th>
                          <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                            C1: Kehadiran (30%)
                          </th>
                          <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                            C2: Ketepatan Waktu (20%)
                          </th>
                          <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                            C3: Tugas (50%)
                          </th>
                          <th className="py-3 px-4 text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {calculationResult.matriksKeputusan.map((item) => {
                          const currentDraft = matrixDraft[item.id] || {
                            C1: item.nilai_mentah.C1,
                            C2: item.nilai_mentah.C2,
                            C3: item.nilai_mentah.C3,
                          };

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                            >
                              <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                                {item.kode_alternatif}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {item.nama}
                                </p>
                                <p className="text-[11px] text-slate-400">Email: {item.email || item.nim} · {item.bagian}</p>
                              </td>

                              {/* C1 Input or Read-only */}
                              <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200 text-sm">
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={currentDraft.C1}
                                    onChange={(e) =>
                                      setMatrixDraft((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          C1: Number(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="font-semibold">{item.nilai_mentah.C1}</span>
                                )}
                              </td>

                              {/* C2 Input or Read-only */}
                              <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200 text-sm">
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={currentDraft.C2}
                                    onChange={(e) =>
                                      setMatrixDraft((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          C2: Number(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="font-semibold">{item.nilai_mentah.C2}</span>
                                )}
                              </td>

                              {/* C3 Input or Read-only */}
                              <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200 text-sm">
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={currentDraft.C3}
                                    onChange={(e) =>
                                      setMatrixDraft((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          C3: Number(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="font-semibold">{item.nilai_mentah.C3}</span>
                                )}
                              </td>

                              {/* Action buttons */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditModal(item.id)}
                                    title="Edit data mahasiswa & nilai"
                                    className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(item.id, item.nama)}
                                    title="Hapus dari perhitungan SMART"
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {isInlineEdit && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Ubah angka nilai mentah di atas lalu simpan untuk mengkalkulasi ulang SMART.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsInlineEdit(false)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveInlineMatrix}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan Matriks &amp; Hitung Ulang</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3 TABLE: Matriks Normalisasi Nilai Utilitas (u_ij) */}
                {activeStep === 3 && (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 w-12 text-center">Kode</th>
                        <th className="py-3 px-4 min-w-[180px]">Nama Mahasiswa</th>
                        <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                          C1 (u_1 = C1/100)
                        </th>
                        <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                          C2 (u_2 = C2/100)
                        </th>
                        <th className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                          C3 (u_3 = C3/100)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {calculationResult.matriksKeputusan.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {item.kode_alternatif}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {item.nama}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {item.utilitas.C1.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {item.utilitas.C2.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {item.utilitas.C3.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* STEP 4 TABLE: Hasil Nilai Akhir & Ranking SMART */}
                {activeStep === 4 && (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4 w-14 text-center">Rank</th>
                        <th className="py-3 px-4 min-w-[170px]">Nama Mahasiswa PKL</th>
                        <th className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          w1&times;u1 (30%)
                        </th>
                        <th className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          w2&times;u2 (20%)
                        </th>
                        <th className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          w3&times;u3 (50%)
                        </th>
                        <th className="py-3 px-4 text-center font-bold text-blue-600">
                          Nilai Akhir (Vi)
                        </th>
                        <th className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          Skala 100
                        </th>
                        <th className="py-3 px-4 text-center">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {calculationResult.ranking.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-50 text-amber-900'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.peringkat}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-400">
                                {item.kode_alternatif}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {item.nama}
                                </p>
                                <p className="text-[10px] text-slate-400">Email: {item.email || item.nim} · {item.bagian}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.kontribusi.C1.toFixed(4)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.kontribusi.C2.toFixed(4)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.kontribusi.C3.toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                            {item.skor_akhir.toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums text-sm">
                            {item.nilai_skala_100.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                item.keterangan === 'Sangat Baik'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : item.keterangan === 'Baik'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {item.keterangan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: INPUT DATA KE PERHITUNGAN SMART */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingStudentId ? 'Edit Data Mahasiswa di SMART' : 'Masukkan Data ke Perhitungan SMART'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input nilai kriteria C1, C2, C3 untuk dihitung secara matematis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Mahasiswa PKL *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Eko Prasetyo"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Mahasiswa *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: eko.prasetyo@mail.ac.id"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institusi / Universitas
                  </label>
                  <input
                    type="text"
                    value={formInstitusi}
                    onChange={(e) => setFormInstitusi(e.target.value)}
                    placeholder="Contoh: Universitas Gadjah Mada"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Divisi / Penempatan di PT Seven Inc.
                  </label>
                  <select
                    value={formBagian}
                    onChange={(e) => setFormBagian(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="IT / Software Engineering">IT / Software Engineering</option>
                    <option value="Human Resources / HRD">Human Resources / HRD</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="UI/UX & Graphic Design">UI/UX & Graphic Design</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Multimedia & Content">Multimedia & Content</option>
                  </select>
                </div>
              </div>

              {/* 3 Benefit Criteria Score Inputs */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nilai 3 Kriteria Benefit (Skala 0 - 100)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C1: Kehadiran
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC1}
                        onChange={(e) => setFormC1(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 30%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C2: Ketepatan Waktu
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC2}
                        onChange={(e) => setFormC2(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 20%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      C3: Tugas
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formC3}
                        onChange={(e) => setFormC3(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded">
                        w: 50%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Simulation Inside Modal */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Estimasi Nilai Vi</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {modalSimulation.vi.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Skala 100</p>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {modalSimulation.skala100.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400">Predikat</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {modalSimulation.keterangan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan &amp; Masukkan ke Perhitungan SMART</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & OTOMASI PERHITUNGAN SMART DARI FILE EXCEL */}
      {isExcelModalOpen && excelParsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Otomatisasi Perhitungan SMART dari File Excel
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-bold">
                      {excelParsedData.length} Mahasiswa Terbaca
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    File: <strong className="text-slate-700 dark:text-slate-300 font-mono">{excelFile?.name}</strong> (Ukuran: {excelFile ? (excelFile.size / 1024).toFixed(1) : 0} KB)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection: Replace vs Merge */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Pilih Mode Pembaruan Data:
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="updateMode"
                    checked={!replaceMode}
                    onChange={() => setReplaceMode(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Gabungkan &amp; Update Data (Merge)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="updateMode"
                    checked={replaceMode}
                    onChange={() => setReplaceMode(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ganti Seluruh Data (Replace)</span>
                </label>
              </div>
            </div>

            {/* Parsed Data Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Mahasiswa</th>
                    <th className="py-2.5 px-3">Email Mahasiswa</th>
                    <th className="py-2.5 px-3">Bagian</th>
                    <th className="py-2.5 px-3 text-center font-mono">C1 (30%)</th>
                    <th className="py-2.5 px-3 text-center font-mono">C2 (20%)</th>
                    <th className="py-2.5 px-3 text-center font-mono">C3 (50%)</th>
                    <th className="py-2.5 px-3 text-center font-bold text-emerald-600">Estimasi Vi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {excelParsedData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">{m.kode_alternatif}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{m.nama}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{m.email}</td>
                      <td className="py-2 px-3 text-slate-500">{m.bagian}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{m.nilai_kriteria?.C1}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{m.nilai_kriteria?.C2}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{m.nilai_kriteria?.C3}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {m.skor_akhir_smart?.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanation & Action footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saat tombol dijalankan, seluruh matriks normalisasi w_j, utilitas u_ij, dan ranking Juara 1 otomatis terupdate secara langsung.</span>
              </p>

              <div className="flex items-center gap-2.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(false)}
                  disabled={isImportingExcel}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExcelSMART}
                  disabled={isImportingExcel}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  {isImportingExcel ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Memproses Otomasi SMART...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Jalankan Perhitungan SMART &amp; Update Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
