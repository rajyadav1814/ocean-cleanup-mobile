import { useEffect, useState } from 'react';
import { citizenApi } from './api';

export function useCitizenStats(refresh = 0) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    citizenApi.getStats()
      .then((data) => { if (mounted && data.ok) setStats(data.stats); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refresh]);

  return { stats, loading };
}

export function useCitizenLeaderboard(refresh = 0) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRow, setMyRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    citizenApi.getLeaderboard()
      .then((data) => {
        if (!mounted) return;
        if (data.ok) {
          setLeaderboard(data.leaderboard || []);
          setMyRow(data.myRow || null);
        }
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refresh]);

  return { leaderboard, myRow, loading };
}

export function useCitizenFeed(limit = 5, refresh = 0) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    citizenApi.getFeed(limit)
      .then((data) => { if (mounted && data.ok) setFeed(data.feed || []); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [limit, refresh]);

  return { feed, loading };
}

export function useCitizenActivities(refresh = 0) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    citizenApi.getActivities()
      .then((data) => { if (mounted && data.ok) setActivities(data.activities || []); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refresh]);

  return { activities, loading };
}

export function useCitizenOrganizations(refresh = 0) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    citizenApi.getOrganizations()
      .then((data) => { if (mounted && data.ok) setOrganizations(data.organizations || []); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refresh]);

  return { organizations, loading };
}
