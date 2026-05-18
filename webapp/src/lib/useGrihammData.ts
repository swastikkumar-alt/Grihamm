import { useCallback, useEffect, useState } from 'react';
import { api, type BootstrapData } from './api';

export function useGrihammData() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.bootstrap());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Supabase data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceData = useCallback((nextData: BootstrapData) => {
    setData(nextData);
    setError('');
  }, []);

  useEffect(() => {
    let isActive = true;

    api.bootstrap()
      .then(nextData => {
        if (!isActive) return;
        setData(nextData);
        setError('');
      })
      .catch(err => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Unable to load Supabase data.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { data, loading, error, reload: load, replaceData };
}
