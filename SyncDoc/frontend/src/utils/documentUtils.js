/**
 * Document display utilities — shared colors and formatters.
 */

export const DOC_ACCENT_COLORS = [
  { bg: '#eef2ff', border: '#c7d2fe', text: '#818cf8', name: 'Lavender' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#2dd4bf', name: 'Mint' },
  { bg: '#fdf2f8', border: '#fbcfe8', text: '#f472b6', name: 'Pink' },
  { bg: '#fff7ed', border: '#fed7aa', text: '#fb923c', name: 'Peach' },
  { bg: '#faf5ff', border: '#e9d5ff', text: '#c084fc', name: 'Purple' },
];

/**
 * Convert a date to a human-friendly relative time string.
 */
export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}
