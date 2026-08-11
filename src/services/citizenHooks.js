import { useCallback, useEffect, useRef, useState } from 'react';
import { citizenApi } from './api';

/**
 * Generic data-fetching hook factory.
 *
 * Behaviour:
 *  - `loading` is true ONLY during the very first fetch (skeleton shown once).
 *  - Subsequent refreshes (tab re-focus) run silently in the background so
 *    already-loaded content is never replaced with a skeleton again.
 *
 * @param {Function} fetcher     - async function that returns the API response
 * @param {Function} selector    - extracts the useful data slice from the response
 * @param {*}        initialData - initial state value ([] or null)
 * @param {Array}    deps        - extra dependencies that trigger a re-fetch
 */
function useApiData(fetcher, selector, initialData, deps = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  // Track whether we have received data at least once
  const hasFetched = useRef(false);

  const run = useCallback(() => {
    let mounted = true;

    // Only show the skeleton on the very first fetch
    if (!hasFetched.current) {
      setLoading(true);
    }

    fetcher()
      .then((res) => {
        if (mounted && res.ok) {
          setData(selector(res));
          hasFetched.current = true;
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { data, loading };
}

// ─── Individual hooks ────────────────────────────────────────────────────────

export function useCitizenStats(refresh = 0) {
  const { data: stats, loading } = useApiData(
    citizenApi.getStats,
    (res) => res.stats,
    null,
    [refresh]
  );
  return { stats, loading };
}

export function useCitizenLeaderboard(refresh = 0) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRow, setMyRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!hasFetched.current) {
      setLoading(true);
    }

    citizenApi
      .getLeaderboard()
      .then((data) => {
        if (!mounted) return;
        if (data.ok) {
          setLeaderboard(data.leaderboard || []);
          setMyRow(data.myRow || null);
          hasFetched.current = true;
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refresh]);

  return { leaderboard, myRow, loading };
}

export function useCitizenFeed(limit = 5, refresh = 0) {
  const { data: feed, loading } = useApiData(
    () => citizenApi.getFeed(limit),
    (res) => res.feed || [],
    [],
    [limit, refresh]
  );
  return { feed, loading };
}

export function useCitizenActivities(refresh = 0) {
  const { data: activities, loading } = useApiData(
    citizenApi.getActivities,
    (res) => res.activities || [],
    [],
    [refresh]
  );
  return { activities, loading };
}

export function useCitizenOrganizations(refresh = 0) {
  const { data: organizations, loading } = useApiData(
    citizenApi.getOrganizations,
    (res) => res.organizations || [],
    [],
    [refresh]
  );
  return { organizations, loading };
}
