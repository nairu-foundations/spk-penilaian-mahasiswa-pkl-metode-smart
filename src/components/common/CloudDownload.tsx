import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { unduhMahasiswa } from '../../utils/mahasiswaExport';

export const CloudDownload: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { format: 'csv' | 'json' }> = ({ format, children, ...props }) => {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try { unduhMahasiswa(await authService.getMahasiswaPKLList(), format); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Data belum dapat diunduh.'); }
    finally { setLoading(false); }
  };
  return <button {...props} type="button" disabled={loading} aria-busy={loading} onClick={download}>{loading ? 'Memuat...' : children}</button>;
};
