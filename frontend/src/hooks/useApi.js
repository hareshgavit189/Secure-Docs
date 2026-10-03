import { useState, useCallback } from 'react';

/**
 * Generic hook that wraps any async API call with loading/error state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(caseService.getCases);
 *   useEffect(() => { execute(); }, []);
 */
export function useApi(apiCall) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall(...args);
        setData(result);
        return result;
      } catch (err) {
        const msg = err.message || 'An unexpected error occurred';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
