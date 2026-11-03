import { useState } from 'react';
import { useQuery } from './useData';
import { spkService } from '../services/spkService';

export function usePeriode() {
  const { data, loading, error } = useQuery(() => spkService.getPeriode());
  const [requestedName, setSelectedPeriode] = useState('');
  const periodeList = data ?? [];
  const periodeAktif = periodeList.find(period => period.status === 'Aktif');
  const selectedPeriod = periodeList.find(period => period.nama_periode === requestedName) ?? periodeAktif ?? periodeList[0];
  return { periodeList, periodeAktif, selectedPeriod, selectedPeriode: selectedPeriod?.nama_periode ?? '', setSelectedPeriode, loading, error };
}
