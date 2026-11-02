import { useState, useEffect, useCallback, useRef } from 'react';
interface UseQueryResult<T> {
  data: T | null; loading: boolean; error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}
export function useQuery<T>(queryFn: () => Promise<T>, deps: unknown[] = []): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestQuery = useRef(queryFn);
  latestQuery.current = queryFn;
  const generation = useRef(0);
  const mounted = useRef(true);
  const execute = useCallback(async () => {
    const request = ++generation.current;
    try {
      const value = await latestQuery.current();
      if (mounted.current && request === generation.current) { setData(value); setError(null); }
    } catch (e) {
      if (mounted.current && request === generation.current) setError(e instanceof Error ? e.message : 'Gagal memuat data Supabase.');
    } finally {
      if (mounted.current && request === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void execute();
    const refresh = () => { if (!document.hidden) void execute(); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('spk:refresh', refresh);
    return () => { mounted.current = false; ++generation.current; window.clearInterval(interval); window.removeEventListener('focus', refresh); window.removeEventListener('spk:refresh', refresh); };
  }, deps);
  return {data, loading, error, refetch: execute, setData};
}
