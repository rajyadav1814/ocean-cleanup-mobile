/**
 * Returns a human-friendly "time ago" string for a given date string.
 * Shared across DashboardScreen and any future screen that needs it.
 *
 * @param {string|null|undefined} dateString – ISO date string
 * @returns {string}
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const diffSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}
