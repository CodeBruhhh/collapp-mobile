import { useEffect, useState } from 'react';

type QueryData<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export type Query<T> = QueryData<T> & { reload: () => void };

/** Minimal loading / error / success wrapper around an async service call. */
export function useQuery<T>(fetcher: () => Promise<T>): Query<T> {
  const [state, setState] = useState<QueryData<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Something went wrong',
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` is a module-level service function; only `attempt` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return { ...state, reload: () => setAttempt((n) => n + 1) };
}
