// Turns a (possibly privacy-trimmed) travel status into the text shown in a
// status pill, e.g. "Traveling · Rome, Italy · until Nov 12". Shared between
// ProfileHeader (the real pill) and EditStatusPanel (the "they see: ..." preview).

import type { VisibleTravelStatus } from '@/types/profile';

// "Nov 20" from "2026-11-20"; "December" from "2026-12".
function formatUntil(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(isoMonth: string): string {
  return new Date(`${isoMonth}-01`).toLocaleDateString('en-US', { month: 'long' });
}

// Null when there's nothing to show (status hidden from this viewer).
export function formatStatusText(status: VisibleTravelStatus | null): string | null {
  if (!status) return null;
  if (status.kind === 'home') return 'Home';

  const label = status.kind === 'traveling' ? 'Traveling' : 'Planning';
  const place = status.city ? `${status.city}, ${status.country}` : status.country;

  if (status.kind === 'traveling' && status.until) {
    return `${label} · ${place} · until ${formatUntil(status.until)}`;
  }
  if (status.kind === 'planning' && status.month) {
    return `${label} · ${place} · ${formatMonth(status.month)}`;
  }
  return `${label} · ${place}`;
}
